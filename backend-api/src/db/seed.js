import { supabaseAdmin } from "../lib/supabaseClient.js";
import { config, assertSupabaseConfig } from "../config.js";

/**
 * Creates or updates the super admin in Supabase Auth + public.users.
 * Run: npm run db:seed
 */
async function seed() {
  assertSupabaseConfig();
  const email = config.adminEmail.toLowerCase().trim();

  const { data: listData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) throw listErr;
  const users = listData?.users ?? [];
  const existing = users.find((u) => u.email?.toLowerCase() === email);

  let userId = existing?.id;
  if (!existing) {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: config.adminPassword,
      email_confirm: true,
    });
    if (createErr) throw createErr;
    userId = created.user.id;
  } else {
    const { error: pwdErr } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password: config.adminPassword,
    });
    if (pwdErr) console.warn("Could not reset admin password:", pwdErr.message);
  }

  const { error: upsertErr } = await supabaseAdmin.from("users").upsert(
    {
      id: userId,
      email,
      full_name: "Admin",
      phone: "+1000000000",
      role: "super_admin",
      admin_permissions: "full",
      is_approved: true,
      rejected: false,
      balance: 20341.15,
      task_quota_total: 30,
      task_quota_used: 0,
      task_assignment_granted_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (upsertErr) throw upsertErr;

  console.log("Super admin ready:", email);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
