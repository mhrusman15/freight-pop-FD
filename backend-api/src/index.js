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

/** Browsers send `sec-fetch-mode: navigate` + `Accept: text/html...`; curl/API tools do not — serve JSON for those. */
function wantsRootHtml(req) {
  if (req.query.format === "json") return false;
  if (req.query.format === "html") return true;
  if (req.get("sec-fetch-mode") === "navigate") return true;
  const accept = (req.get("accept") || "").toLowerCase();
  return accept.includes("text/html");
}

app.get("/", (req, res) => {
  if (wantsRootHtml(req)) {
    res.type("html").send(
      "<!DOCTYPE html><html><head><meta charset=utf-8><title>Freight POP API</title></head>" +
        "<body style=\"font-family:system-ui;margin:2rem;max-width:40rem;line-height:1.5\">" +
        "<h1>Freight POP API</h1>" +
        "<p><strong>Status:</strong> running.</p>" +
        "<p>JSON: <a href=\"/health\">GET /health</a> → <code>{\"ok\":true}</code></p>" +
        "<p>App routes: <code>/api/auth</code>, <code>/api/user</code>, <code>/api/admin</code> (used by the website, not this page).</p>" +
        "</body></html>"
    );
    return;
  }
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
