/**
 * Monorepo root build for Vercel / local: install + build Next.js in `frontend/`.
 * Stops misconfigured "API-only" Vercel projects that use repo root and would otherwise ship the Next app.
 */
const { execSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const frontend = path.join(root, "frontend");

const isVercel = Boolean(process.env.VERCEL);
const project = String(process.env.VERCEL_PROJECT_NAME || "");

if (isVercel && !process.env.FORCE_FRONTEND_ROOT_BUILD && /-backend$/i.test(project)) {
  console.error(
    "\n[freight-pop] This Vercel project is building from the Git repository root, which runs the Next.js frontend.\n" +
      `Your project name is "${project}" (matches *-backend).\n\n` +
      "Fix — Vercel → Project → Settings → General → Root Directory → set to:\n" +
      "  backend-api\n" +
      "Then redeploy. The API uses backend-api/vercel.json (@vercel/node).\n\n" +
      "Alternatively use one project with Services from the repo root (see root vercel.json).\n" +
      "To override this check (not recommended): set env FORCE_FRONTEND_ROOT_BUILD=1\n"
  );
  process.exit(1);
}

execSync("npm ci --include=dev", { cwd: frontend, stdio: "inherit" });
execSync("npm run build", { cwd: frontend, stdio: "inherit" });
