import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/user.js";
import { config, assertSupabaseConfig } from "./config.js";

const __filename = fileURLToPath(import.meta.url);

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

function start() {
  assertSupabaseConfig();
  app.listen(config.port, () => {
    console.log(`API running on http://localhost:${config.port}`);
  });
}

// Start HTTP server only when this file is run directly (`node src/index.js`), not when imported (e.g. Vercel `api/index.js`).
const isMainModule =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMainModule) {
  start();
}

export default app;
