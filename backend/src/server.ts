import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { createRateLimiter } from "./lib/rate-limit.js";
import { createRouter } from "./routes.js";
import { store } from "./lib/store.js";

const app = express();

app.set("trust proxy", 1);
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  next();
});
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (!config.allowedOrigins.has(origin)) {
        return callback(null, false);
      }
      return callback(null, true);
    },
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  res.json({ name: "TrustVault AI API", status: "online" });
});

app.use("/api", createRateLimiter({ windowMs: 60_000, max: 240, label: "api" }), createRouter());

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 500;
  const message = error instanceof Error ? error.message : "Unexpected server error";
  res.status(Number.isFinite(status) ? status : 500).json({ error: message });
});

await store.init();

app.listen(config.port, () => {
  console.log(`TrustVault AI API listening on http://localhost:${config.port}`);
});
