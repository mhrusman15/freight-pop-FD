import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

/**
 * Server-side admin client with service role — bypasses RLS.
 * Use this for all database reads/writes and Auth admin operations.
 */
export const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Public auth client (publishable/anon key).
 * Use this for login/refresh/getUser to avoid polluting the admin client with a user session,
 * which would cause RLS-protected reads to return empty.
 */
export const supabaseAuth = createClient(config.supabaseUrl, config.supabasePublishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
