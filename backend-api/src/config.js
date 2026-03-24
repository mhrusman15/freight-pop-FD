import dotenv from "dotenv";

dotenv.config();

const databaseUrlRaw = (process.env.DATABASE_URL || "").trim();
const defaultDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/freight_pop";
const useMemoryStoreExplicit = process.env.USE_MEMORY_STORE === "1";
const useMemoryStoreFromDbUrl = databaseUrlRaw.toLowerCase() === "memory";
export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: databaseUrlRaw && databaseUrlRaw.toLowerCase() !== "memory" ? databaseUrlRaw : defaultDatabaseUrl,
  /**
   * Use in-memory store (no PostgreSQL) only when explicitly enabled.
   * This prevents accidental user loss on restart when DATABASE_URL is not set.
   */
  useMemoryStore: useMemoryStoreExplicit || useMemoryStoreFromDbUrl,
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  /** Short-lived access token (Bearer). */
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  /** Long-lived refresh token (body / client storage). */
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  /** Separate secret so access JWTs cannot be used as refresh. */
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET || "change-me-in-production"}-refresh`,
  /** @deprecated use jwtAccessExpiresIn */
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  adminEmail: process.env.ADMIN_EMAIL || "admin@gmail.com",
  adminPassword: process.env.ADMIN_PASSWORD || "admin@321@123",
};
