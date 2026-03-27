import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  supabaseUrl: (process.env.SUPABASE_URL || "").trim(),
  supabaseServiceRoleKey: (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim(),
  supabasePublishableKey: (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "").trim(),
  adminEmail: process.env.ADMIN_EMAIL || "admin@gmail.com",
  adminPassword: process.env.ADMIN_PASSWORD || "admin@321@123",
};

export function assertSupabaseConfig() {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in your environment."
    );
  }
}

export function assertSupabaseAuthConfig() {
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY). Needed for login/refresh/getUser."
    );
  }
}
