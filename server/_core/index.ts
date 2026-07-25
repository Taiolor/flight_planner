import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startFlightNotificationJob } from "../pushNotifications";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

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
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "https://cdn.jsdelivr.net",
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:", ...(isDev ? ["ws:", "wss:"] : [])],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: isDev
            ? ["*"]
            : ["https://*.manus.space", "https://*.manus.computer"],
        },
      },
      crossOriginEmbedderPolicy: false,
      frameguard: isDev ? false : { action: "sameorigin" },
    })
  );

  // Configure body parser com limite reduzido (2MB é suficiente para esta aplicação)
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));

  // Aplicar rate limiting geral em todas as rotas /api
  app.use("/api", generalLimiter);

  // Rate limiting mais restrito para rotas de autenticação OAuth
  app.use("/api/oauth", authLimiter);

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // tRPC API
  app.use("/api/trpc", (req, res, next) => {
    if (req.path.includes("flightAuth.login")) {
      return authLimiter(req, res, next);
    }
    next();
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
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
    // Iniciar job de notificações push (verifica voos a cada hora)
    startFlightNotificationJob();
  });
}

startServer().catch(console.error);
