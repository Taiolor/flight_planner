import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { runScheduledFlightNotifications } from "../pushNotifications";
import { runUsageTelemetryCleanup } from "../usageTelemetryCleanup";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { ENV } from "./env";
import { createProxyMiddleware } from "http-proxy-middleware";
import { createTrpcLoginRateLimiter } from "./trpcLoginRateLimit";
import { getContentSecurityPolicy } from "./contentSecurityPolicy";
import { registerStorageProxy } from "./storageProxy";
import { getSessionFromCookie } from "../flightAuthMiddleware";
import { addFlightMemoryMedia, upsertFlightMemory } from "../memoriesDb";
import { addOperationalAttachment } from "../operationalDb";
import { storagePut } from "../storage";
import { transcribeFlyIaVoice } from "../flyIaVoice";
import { runScheduledOperationalReport } from "../operationalReportSchedule";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Rate limiter geral: 200 requisições por IP a cada 15 minutos
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Tente novamente em alguns minutos." },
});

// Rate limiter para rotas de autenticação: 20 requisições por IP a cada 15 minutos
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Muitas tentativas de autenticação. Tente novamente em alguns minutos.",
  },
});

const flyIaVoiceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de transcrição. Tente novamente em alguns minutos." },
});

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Confiar no proxy reverso (necessário para rate limiting correto com X-Forwarded-For)
  app.set("trust proxy", 1);

  // Security headers via Helmet
  // Em dev, permitir iframe para o emulador/preview funcionar
  const isDev = process.env.NODE_ENV === "development";
  app.use(
    helmet({
      contentSecurityPolicy: getContentSecurityPolicy(isDev),
      crossOriginEmbedderPolicy: false,
      frameguard: isDev ? false : { action: "sameorigin" },
    })
  );

  // Configure body parser com limite reduzido (2MB é suficiente para esta aplicação)
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));

  // Aplicar rate limiting geral em todas as rotas /api
  app.use("/api", generalLimiter);
  // Proxy Google Maps requests to hide API key from frontend
  app.use(
    "/api/maps/proxy",
    createProxyMiddleware({
      target: ENV.forgeApiUrl || "https://forge.butterfly-effect.dev",
      changeOrigin: true,
      pathRewrite: requestPath => {
        if (!ENV.forgeApiKey) {
          console.error("Maps proxy credentials missing");
          return `/v1/maps/proxy${requestPath}`;
        }
        try {
          const url = new URL(`/v1/maps/proxy${requestPath}`, "http://localhost");
          url.searchParams.set("key", ENV.forgeApiKey);
          return url.pathname + url.search + url.hash;
        } catch (e) {
          console.error("Error setting proxy key:", e);
          return `/v1/maps/proxy${requestPath}`;
        }
      },
    })
  );

  // Rate limiting mais restrito para rotas de autenticação OAuth
  app.use("/api/oauth", authLimiter);

  // Servir ativos estáticos privados publicados para esta aplicação.
  registerStorageProxy(app);

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // O middleware é registrado uma única vez antes do adaptador tRPC.
  app.use("/api/trpc", createTrpcLoginRateLimiter(authLimiter));

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  app.post("/api/scheduled/flight-notifications", runScheduledFlightNotifications);
  app.post("/api/scheduled/usage-telemetry-cleanup", runUsageTelemetryCleanup);
  app.post("/api/scheduled/operational-executive-report", runScheduledOperationalReport);

  app.post(
    "/api/memories/upload",
    express.raw({ type: ["image/*", "video/*"], limit: "25mb" }),
    async (req, res) => {
      try {
        const session = await getSessionFromCookie(req);
        if (!session) {
          res.status(401).json({ error: "Faça login para acessar." });
          return;
        }

        const year = Number(req.query.year);
        const weekNumber = Number(req.query.weekNumber);
        const fileName = String(req.query.fileName ?? "memoria").slice(0, 255);
        const mimeType = String(req.headers["content-type"] ?? "").toLowerCase();
        const mediaType = mimeType.startsWith("image/")
          ? "image"
          : mimeType.startsWith("video/")
            ? "video"
            : null;

        if (
          !Number.isInteger(year) ||
          year < 2020 ||
          year > 2100 ||
          !Number.isInteger(weekNumber) ||
          weekNumber < 1 ||
          weekNumber > 54 ||
          !mediaType ||
          !Buffer.isBuffer(req.body) ||
          req.body.length === 0
        ) {
          res.status(400).json({ error: "Arquivo ou passagem inválidos." });
          return;
        }

        const memory = await upsertFlightMemory({ year, weekNumber });
        if (!memory) {
          res.status(503).json({ error: "Não foi possível preparar a memória." });
          return;
        }

        const sessionHash = crypto
          .createHash("sha256")
          .update(session.email.toLowerCase())
          .digest("hex")
          .slice(0, 16);
        const extension = fileName.includes(".")
          ? fileName.split(".").pop()!.replace(/[^a-z0-9]/gi, "").slice(0, 12)
          : mediaType === "image"
            ? "jpg"
            : "mp4";
        const storageKey = `memories/${sessionHash}/${year}/week-${weekNumber}/${crypto.randomUUID()}.${extension}`;
        const uploaded = await storagePut(storageKey, req.body, mimeType);
        const media = await addFlightMemoryMedia({
          memoryId: memory.id,
          storageKey: uploaded.key,
          storageUrl: uploaded.url,
          mediaType,
          mimeType,
          fileName,
          fileSizeBytes: req.body.length,
        });

        res.status(201).json({ media });
      } catch (error) {
        console.error("[Memories] Upload failed", error);
        res.status(500).json({ error: "Não foi possível enviar a mídia." });
      }
    }
  );

  app.post(
    "/api/operational/upload",
    express.raw({ type: ["image/*", "application/pdf"], limit: "10mb" }),
    async (req, res) => {
      try {
        const session = await getSessionFromCookie(req);
        if (!session) {
          res.status(401).json({ error: "Faça login para acessar." });
          return;
        }

        const year = Number(req.query.year);
        const weekNumber = Number(req.query.weekNumber);
        const attachmentType = String(req.query.attachmentType ?? "outro");
        const description = String(req.query.description ?? "").trim().slice(0, 240);
        const fileName = String(req.query.fileName ?? "anexo").slice(0, 255);
        const mimeType = String(req.headers["content-type"] ?? "").toLowerCase();
        const validAttachmentTypes = new Set(["comprovante", "cartao_embarque", "recibo", "outro"]);
        const validMime = mimeType === "application/pdf" || mimeType.startsWith("image/");

        if (
          !Number.isInteger(year) || year < 2020 || year > 2100 ||
          !Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 54 ||
          !validAttachmentTypes.has(attachmentType) || !validMime ||
          !Buffer.isBuffer(req.body) || req.body.length === 0
        ) {
          res.status(400).json({ error: "Anexo operacional inválido." });
          return;
        }

        const sessionHash = crypto.createHash("sha256").update(session.email.toLowerCase()).digest("hex").slice(0, 16);
        const extension = fileName.includes(".")
          ? fileName.split(".").pop()!.replace(/[^a-z0-9]/gi, "").slice(0, 12)
          : mimeType === "application/pdf" ? "pdf" : "jpg";
        const storageKey = `operational/${sessionHash}/${year}/week-${weekNumber}/${crypto.randomUUID()}.${extension}`;
        const uploaded = await storagePut(storageKey, req.body, mimeType);
        const id = await addOperationalAttachment({
          year,
          weekNumber,
          attachmentType: attachmentType as "comprovante" | "cartao_embarque" | "recibo" | "outro",
          storageKey: uploaded.key,
          storageUrl: uploaded.url,
          mimeType,
          fileName,
          fileSizeBytes: req.body.length,
          description: description || undefined,
        });

        if (!id) {
          res.status(503).json({ error: "Não foi possível registrar o anexo." });
          return;
        }
        res.status(201).json({ id, url: uploaded.url });
      } catch (error) {
        console.error("[Operational] Upload failed", error);
        res.status(500).json({ error: "Não foi possível enviar o anexo." });
      }
    }
  );

  app.post(
    "/api/flyia/voice-transcribe",
    flyIaVoiceLimiter,
    express.raw({ type: ["audio/webm", "audio/ogg", "audio/wav", "audio/mpeg", "audio/mp4", "audio/x-m4a"], limit: "5mb" }),
    transcribeFlyIaVoice
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
