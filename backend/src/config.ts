import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

export const config = {
  port: Number(process.env.PORT ?? 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
  dataDir: process.env.DATA_DIR ?? path.resolve(process.cwd(), "data"),
  encryptionMasterKey:
    process.env.ENCRYPTION_MASTER_KEY ?? "trustvault-local-development-master-key",
  vaultAccessKey: process.env.VAULT_ACCESS_KEY,
  authTokenTtlHours: Number(process.env.AUTH_TOKEN_TTL_HOURS ?? 12),
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-5.5",
  mongodbUri: process.env.MONGODB_URI,
  terminal3: {
    environment: process.env.T3N_ENVIRONMENT ?? "testnet",
    apiKey: process.env.T3N_API_KEY,
    did: process.env.T3N_DID
  }
};

export function isProductionReadyConfig() {
  return {
    encryptionKeyConfigured: Boolean(process.env.ENCRYPTION_MASTER_KEY),
    vaultAccessKeyConfigured: Boolean(config.vaultAccessKey),
    terminal3Configured: Boolean(config.terminal3.apiKey),
    openaiConfigured: Boolean(config.openaiApiKey),
    mongodbConfigured: Boolean(config.mongodbUri)
  };
}

function parseOrigins(value: string | undefined) {
  return new Set(
    [
      process.env.FRONTEND_ORIGIN,
      process.env.APP_BASE_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      ...(value?.split(",") ?? [])
    ]
      .map((origin) => origin?.trim())
      .filter((origin): origin is string => Boolean(origin))
  );
  
  
