-- Project "Aegis" database schema

-- Enable required extensions.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Stores user accounts, their auth info, and their crypto keys
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,

    -- The user's public key, for others to encrypt messages TO them
    public_key TEXT NOT NULL,

    -- The user's private key, encrypted with a key derived from their password
    -- The server CANNOT decrypt this. It just stores it for the user.
    encrypted_private_key TEXT NOT NULL
);

-- Stores the Admin's public key (there will only be one row)
CREATE TABLE IF NOT EXISTS admin_config (
    config_id INT PRIMARY KEY DEFAULT 1,
    admin_public_key TEXT NOT NULL
);

-- Stores all messages. This data is UNREADABLE by the database.
CREATE TABLE IF NOT EXISTS messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(user_id),
    recipient_id UUID NOT NULL REFERENCES users(user_id),

    -- The encrypted payload FOR THE RECIPIENT
    payload_recipient TEXT NOT NULL,

    -- The encrypted payload FOR THE ADMIN
    payload_admin TEXT NOT NULL,

    -- The unique "number-used-once" for this message's encryption
    nonce TEXT NOT NULL,

    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

