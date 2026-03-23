import { pool } from "./pool.js";
import { config } from "../config.js";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`,
  "CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)",
  "CREATE INDEX IF NOT EXISTS idx_users_status ON users (status)",
  "CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC)",
  "CREATE INDEX IF NOT EXISTS idx_users_status_created ON users (status, created_at DESC)",
  // Ensure legacy databases allow super_admin role.
  `DO $$
  BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('user', 'admin', 'super_admin'));
  EXCEPTION
    WHEN undefined_table THEN
      NULL;
  END $$`,
  // Optional: store fine-grained admin permissions (view_only, edit, approve, full, etc.)
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'admin_permissions') THEN
      ALTER TABLE users ADD COLUMN admin_permissions VARCHAR(50);
    END IF;
  END $$`,
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'asset_balance') THEN
      ALTER TABLE users ADD COLUMN asset_balance DECIMAL(18,2) NOT NULL DEFAULT 20341.15;
    END IF;
  END $$`,
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'task_quota_total') THEN
      ALTER TABLE users ADD COLUMN task_quota_total INTEGER NOT NULL DEFAULT 30;
    END IF;
  END $$`,
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'task_quota_used') THEN
      ALTER TABLE users ADD COLUMN task_quota_used INTEGER NOT NULL DEFAULT 0;
    END IF;
  END $$`,
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'task_assignment_required') THEN
      ALTER TABLE users ADD COLUMN task_assignment_required BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
  END $$`,
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'task_assignment_requested_at') THEN
      ALTER TABLE users ADD COLUMN task_assignment_requested_at TIMESTAMPTZ;
    END IF;
  END $$`,
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'task_assignment_granted_at') THEN
      ALTER TABLE users ADD COLUMN task_assignment_granted_at TIMESTAMPTZ;
    END IF;
  END $$`,
  `CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql`,
  "DROP TRIGGER IF EXISTS users_updated_at ON users",
  `CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at()`,
];

async function init() {
  if (config.useMemoryStore) {
    console.log("Using in-memory store: skipping database init. Run with DATABASE_URL set when using PostgreSQL.");
    process.exit(0);
    return;
  }
  const client = await pool.connect();
  try {
    for (const sql of STATEMENTS) {
      await client.query(sql);
    }
    console.log("Database initialized: users table and indexes created.");
  } finally {
    client.release();
    await pool.end();
  }
}

init().catch((e) => {
  console.error(e);
  process.exit(1);
});
