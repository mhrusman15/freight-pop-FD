/**
 * Vercel runs Express natively — do not wrap with `serverless-http` (double-handling
 * can hang until FUNCTION_INVOCATION_TIMEOUT).
 * @see https://vercel.com/docs/frameworks/backend/express
 */
import app from "../src/index.js";

export default app;
