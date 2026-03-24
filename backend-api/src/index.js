import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/user.js";
import { config } from "./config.js";
import { memoryStore } from "./store/memory-store.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Same response as /health so opening the site root shows {"ok":true} in the browser.
app.get("/", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

async function start() {
  if (config.useMemoryStore) {
    await memoryStore.init();
    console.log("Using in-memory store (no PostgreSQL). Admin seeded.");
  }
  app.listen(config.port, () => {
    console.log(`API running on http://localhost:${config.port}`);
  });
}

start();
