import type { NextConfig } from "next";

/**
 * Stop Vercel from shipping the Next app on API-only projects (e.g. named *-backend)
 * that still point at this repo without Root Directory = backend-api. Vercel often runs
 * `next build` in frontend/ directly, bypassing the repo-root package.json guard.
 */
const vercelProject = process.env.VERCEL_PROJECT_NAME || "";
if (
  process.env.VERCEL &&
  !process.env.FORCE_FRONTEND_ROOT_BUILD &&
  /-backend$/i.test(vercelProject)
) {
  throw new Error(
    `[freight-pop] Refusing to build Next.js for Vercel project "${vercelProject}".\n` +
      "This project name ends with \"-backend\" but would deploy the web app.\n\n" +
      "Fix: Vercel → Settings → General → Root Directory → backend-api\n" +
      "Then redeploy (Express API only; no /login page on that host).\n" +
      "Docs: backend-api/README.md — Deploy on Vercel.\n" +
      "Override (not recommended): env FORCE_FRONTEND_ROOT_BUILD=1\n"
  );
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
