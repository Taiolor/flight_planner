import type { Express, Request, Response } from "express";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ENV } from "./env";

const STORAGE_REQUEST_TIMEOUT_MS = 15_000;

const IMMUTABLE_PUBLIC_ASSET_KEYS = new Set([
  "smartfly-sf-apple-touch-icon_598faae4.png",
  "smartfly-sf-favicon-48_45731084.png",
  "smartfly-sf-favicon-32_fa912500.png",
  "smartfly-sf-favicon-16_8b3260d7.png",
  "smartfly-sf-pwa-icon_783c04c6.webp",
  "smartfly-airline-latam_c982c0a8.png",
  "smartfly-airline-gol_5f97474c.png",
  "smartfly-airline-azul_56363add.png",
  "blumenau_0c5430d7.jpg",
  "sao-paulo_da0e548a.jpg",
  "rio-de-janeiro_3f37d89b.jpg",
  "porto-alegre_14400559.jpg",
  "joinville_af0d11c7.jpg",
  "goiania_c168de7c.jpg",
  "ribeirao-preto_2765aed4.jpg",
  "itu_6771c3c3.jpg",
  "guarulhos_dab4a2d7.jpg",
  "piracicaba_9040475e.jpg",
  "novo-hamburgo_f09cf41e.jpg",
]);

export function getStorageCacheControl(key: string) {
  return IMMUTABLE_PUBLIC_ASSET_KEYS.has(key)
    ? "public, max-age=604800, immutable"
    : "private, no-store";
}

export function getSafeStorageContentType(contentType: string | null) {
  const normalized = contentType?.split(";", 1)[0]?.trim().toLowerCase();
  return normalized && /^[a-z]+\/[a-z0-9.+-]+$/.test(normalized)
    ? normalized
    : "application/octet-stream";
}

function getSafeStorageContentLength(contentLength: string | null) {
  return contentLength && /^\d+$/.test(contentLength) ? contentLength : undefined;
}

async function getSignedStorageUrl(key: string) {
  const forgeUrl = new URL(
    "v1/storage/presign/get",
    ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
  );
  forgeUrl.searchParams.set("path", key);

  const forgeResp = await fetch(forgeUrl, {
    headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
    signal: AbortSignal.timeout(STORAGE_REQUEST_TIMEOUT_MS),
  });
  if (!forgeResp.ok) {
    throw new Error(`Storage backend responded with ${forgeResp.status}`);
  }

  const { url } = (await forgeResp.json()) as { url?: string };
  if (!url) {
    throw new Error("Storage backend returned an empty signed URL");
  }

  const signedUrl = new URL(url);
  if (signedUrl.protocol !== "https:" || !signedUrl.hostname.endsWith(".cloudfront.net")) {
    throw new Error("Storage backend returned an unsupported signed URL host");
  }

  return signedUrl;
}

/**
 * Entrega bytes pelo domínio da aplicação. O redirecionamento assinado era
 * correto para downloads, mas falhava para recursos visuais no domínio
 * publicado; manter os bytes same-origin evita esse salto no navegador.
 */
export async function serveStorageAsset(req: Request, res: Response) {
  const key = (req.params as Record<string, string | undefined>)["0"];
  if (!key) {
    res.status(400).send("Missing storage key");
    return;
  }

  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    res.status(500).send("Storage proxy not configured");
    return;
  }

  try {
    const signedUrl = await getSignedStorageUrl(key);
    const storageResp = await fetch(signedUrl, {
      redirect: "error",
      headers: req.headers.range ? { Range: req.headers.range } : undefined,
      signal: AbortSignal.timeout(STORAGE_REQUEST_TIMEOUT_MS),
    });
    if ((storageResp.status !== 200 && storageResp.status !== 206) || !storageResp.body) {
      throw new Error(`Storage object responded with ${storageResp.status}`);
    }

    res.status(storageResp.status);
    res.setHeader("Content-Type", getSafeStorageContentType(storageResp.headers.get("content-type")));
    res.setHeader("Cache-Control", getStorageCacheControl(key));
    res.setHeader("X-Content-Type-Options", "nosniff");

    const contentLength = getSafeStorageContentLength(storageResp.headers.get("content-length"));
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }
    const contentRange = storageResp.headers.get("content-range");
    if (contentRange) {
      res.setHeader("Content-Range", contentRange);
    }
    const acceptRanges = storageResp.headers.get("accept-ranges");
    if (acceptRanges) {
      res.setHeader("Accept-Ranges", acceptRanges);
    }

    await pipeline(
      Readable.fromWeb(storageResp.body as unknown as import("node:stream/web").ReadableStream),
      res
    );
  } catch (error) {
    console.error("[StorageProxy] failed:", error);
    if (!res.headersSent) {
      res.status(502).send("Storage proxy error");
    } else if (!res.writableEnded) {
      res.destroy();
    }
  }
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", serveStorageAsset);
}
