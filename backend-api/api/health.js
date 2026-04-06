/**
 * Tiny cold path for monitors — no Express / no heavy imports (avoids slow boots on Hobby).
 */
export default function handler(req, res) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ ok: true }));
}
