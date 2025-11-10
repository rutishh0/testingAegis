#!/usr/bin/env node

/**
 * Inserts or updates the admin_public_key in the admin_config table.
 * Requires DATABASE_URL and ADMIN_PUBLIC_KEY environment variables.
 */

require('dotenv').config();

const { Pool } = require('pg');

async function seedAdminConfig() {
  const connectionString = process.env.DATABASE_URL;
  const adminPublicKey = process.env.ADMIN_PUBLIC_KEY;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }

  if (!adminPublicKey) {
    throw new Error('ADMIN_PUBLIC_KEY environment variable is not set.');
  }

  const pool = new Pool({
    connectionString,
    ssl:
      process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    await pool.query(
      `
        INSERT INTO admin_config (config_id, admin_public_key)
        VALUES (1, $1)
        ON CONFLICT (config_id)
        DO UPDATE SET admin_public_key = EXCLUDED.admin_public_key
      `,
      [adminPublicKey]
    );

    console.log('Admin public key saved to admin_config table.');
  } finally {
    await pool.end();
  }
}

seedAdminConfig().catch((error) => {
  console.error('Failed to seed admin configuration:', error);
  process.exitCode = 1;
});

