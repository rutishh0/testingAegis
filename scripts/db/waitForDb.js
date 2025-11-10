#!/usr/bin/env node

/**
 * Polls the PostgreSQL database until a connection succeeds or times out.
 */

require('dotenv').config();

const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const timeoutMs = Number.parseInt(process.env.DB_WAIT_TIMEOUT_MS || '45000', 10);
const intervalMs = Number.parseInt(process.env.DB_WAIT_INTERVAL_MS || '1500', 10);

const ssl =
  process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false;

async function tryConnect() {
  const client = new Client({
    connectionString,
    ssl,
  });

  try {
    await client.connect();
    await client.end();
    return true;
  } catch (error) {
    console.log('Waiting for database...', error.message);
    return false;
  }
}

async function waitForDb() {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    // eslint-disable-next-line no-await-in-loop
    const ready = await tryConnect();
    if (ready) {
      console.log('Database connection established.');
      process.exit(0);
    }

    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  console.error('Database connection timed out.');
  process.exit(1);
}

waitForDb();

