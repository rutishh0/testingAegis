#!/usr/bin/env node

/**
 * Applies the base database schema using the existing schema.sql file.
 * Relies on DATABASE_URL (and optional DB_SSL) environment variables.
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function applySchema() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }

  const pool = new Pool({
    connectionString,
    ssl:
      process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
  });

  const schemaPath = path.resolve(__dirname, '../../schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    await pool.query(schemaSql);
    console.log('Database schema applied successfully.');
  } finally {
    await pool.end();
  }
}

applySchema().catch((error) => {
  console.error('Failed to apply database schema:', error);
  process.exitCode = 1;
});

