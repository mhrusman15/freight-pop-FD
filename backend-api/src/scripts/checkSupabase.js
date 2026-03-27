import { supabaseAdmin } from "../lib/supabaseClient.js";

const email = (process.argv[2] || "admin@gmail.com").toLowerCase().trim();

const lr = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
console.log("listUsers error:", lr.error?.message ?? null);
const authUser = (lr.data?.users ?? []).find((u) => (u.email ?? "").toLowerCase() === email);
console.log("auth user found:", Boolean(authUser), authUser?.id ?? null);

const pr = await supabaseAdmin.from("users").select("*").eq("email", email).maybeSingle();
console.log("profile error:", pr.error?.message ?? null);
console.log("profile found:", Boolean(pr.data), pr.data?.id ?? null);
if (pr.data) {
  console.log("role:", pr.data.role, "is_approved:", pr.data.is_approved, "rejected:", pr.data.rejected);
}

