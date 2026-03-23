import bcrypt from "bcryptjs";
import { pool } from "./pool.js";
import { config } from "../config.js";

async function seed() {
  const client = await pool.connect();
  try {
    const email = config.adminEmail.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(config.adminPassword, 10);

    await client.query(
      `INSERT INTO users (full_name, email, phone, password_hash, status, role, admin_permissions)
       VALUES ($1, $2, $3, $4, 'approved', 'super_admin', 'full')
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         role = 'super_admin',
         admin_permissions = 'full',
         status = 'approved',
         updated_at = NOW()`,
      ["Admin", email, "+1000000000", passwordHash]
    );
    console.log("Admin user seeded:", email);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
