import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || "";
export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: databaseUrl || "postgresql://postgres:postgres@localhost:5432/freight_pop",
  /** Use in-memory store (no PostgreSQL). Set USE_MEMORY_STORE=1 or leave DATABASE_URL empty to run without DB. */
  useMemoryStore: process.env.USE_MEMORY_STORE === "1" || !databaseUrl || databaseUrl === "memory",
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
