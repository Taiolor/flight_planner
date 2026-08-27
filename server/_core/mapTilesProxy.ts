import type { Express, Request, Response } from "express";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const CARTO_TILE_TIMEOUT_MS = 10_000;
const MAX_TILE_ZOOM = 18;

export function isValidCartoTileCoordinate(value: string, max: number) {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) >= 0 && Number(value) <= max;
}

export function getCartoTileUrl(z: number, x: number, y: number) {
  const subdomain = ["a", "b", "c"][(x + y) % 3] ?? "a";
  return `https://${subdomain}.basemaps.cartocdn.com/light_all/${z}/${x}/${y}.png`;
}

export async function serveCartoTile(req: Request, res: Response) {
  const { z: zParam, x: xParam, y: yParam } = req.params;
  const z = Number(zParam);
  const x = Number(xParam);
  const y = Number(yParam);
  const tileLimit = Number.isSafeInteger(z) && z >= 0 && z <= MAX_TILE_ZOOM ? 2 ** z - 1 : -1;

  if (
    !isValidCartoTileCoordinate(zParam, MAX_TILE_ZOOM) ||
    !isValidCartoTileCoordinate(xParam, tileLimit) ||
    !isValidCartoTileCoordinate(yParam, tileLimit)
  ) {
    res.status(400).send("Invalid map tile coordinates");
    return;
  }

  try {
    const tileResponse = await fetch(getCartoTileUrl(z, x, y), {
      signal: AbortSignal.timeout(CARTO_TILE_TIMEOUT_MS),
    });
    if (!tileResponse.ok || !tileResponse.body || !tileResponse.headers.get("content-type")?.startsWith("image/")) {
      throw new Error(`Carto tile responded with ${tileResponse.status}`);
    }

    res.status(200);
    res.setHeader("Content-Type", tileResponse.headers.get("content-type")!);
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const contentLength = tileResponse.headers.get("content-length");
    if (contentLength && /^\d+$/.test(contentLength)) {
      res.setHeader("Content-Length", contentLength);
    }

    await pipeline(
      Readable.fromWeb(tileResponse.body as unknown as import("node:stream/web").ReadableStream),
      res
    );
  } catch (error) {
    console.error("[MapTilesProxy] failed:", error);
    if (!res.headersSent) {
      res.status(502).send("Map tiles temporarily unavailable");
    } else if (!res.writableEnded) {
      res.destroy();
    }
  }
}

export function registerMapTilesProxy(app: Express) {
  app.get("/map-tiles/:z/:x/:y.png", serveCartoTile);
}
