/*
  # SAS Explorer Database Schema - Fresh Start

  This migration creates a clean database schema for the Solana Attestation Service Explorer.
  All existing tables are dropped and recreated with proper structure.

  ## Tables Created

  ### `credentials`
  Stores issuer credentials with authority and authorized signers
  - `id` (uuid, primary key) - Unique identifier
  - `pubkey` (text, unique, indexed) - Credential account public key
  - `authority` (text, indexed) - Authority public key
  - `name` (text) - Human-readable credential name
  - `authorized_signers` (text[]) - Array of authorized signer public keys
  - `created_at` (timestamptz) - Creation timestamp
  - `signature` (text) - Transaction signature

  ### `schemas`
  Stores schema definitions for attestations
  - `id` (uuid, primary key) - Unique identifier
  - `pubkey` (text, unique, indexed) - Schema account public key
  - `credential_pubkey` (text, foreign key, indexed) - Parent credential reference
  - `credential_name` (text) - Denormalized credential name
  - `name` (text) - Schema name
  - `description` (text) - Schema description
  - `layout` (jsonb) - Array of layout type identifiers (0-25)
  - `field_names` (text[]) - Array of field names
  - `is_paused` (boolean) - Whether schema is paused
  - `version` (int) - Schema version number
  - `is_tokenized` (boolean) - Whether schema is tokenized
  - `tokenized_mint` (text, nullable) - Token mint address if tokenized
  - `created_at` (timestamptz) - Creation timestamp
  - `signature` (text) - Transaction signature

  ### `attestations`
  Stores individual attestations with decoded data
  - `id` (uuid, primary key) - Unique identifier
  - `pubkey` (text, unique, indexed) - Attestation account public key
  - `nonce` (text, indexed) - Unique nonce
  - `credential_pubkey` (text, foreign key, indexed) - Credential reference
  - `schema_pubkey` (text, foreign key, indexed) - Schema reference
  - `schema_name` (text) - Denormalized schema name
  - `data_raw` (bytea) - Raw attestation data bytes
  - `data_decoded` (jsonb) - Decoded attestation data as JSON
  - `signer` (text, indexed) - Authorized signer who created this
  - `expiry` (bigint) - Unix timestamp expiry (0 = never expires)
  - `is_tokenized` (boolean) - Whether attestation is tokenized
  - `token_account` (text, nullable) - Token account address if tokenized
  - `attestation_mint` (text, nullable) - Token mint address if tokenized
  - `is_closed` (boolean) - Whether attestation has been closed
  - `created_at` (timestamptz) - Creation timestamp
  - `closed_at` (timestamptz, nullable) - Closure timestamp
  - `signature` (text) - Transaction signature

  ### `transactions`
  Stores all program transactions for tracking
  - `id` (uuid, primary key) - Unique identifier
  - `signature` (text, unique, indexed) - Transaction signature
  - `slot` (bigint, indexed) - Block slot number
  - `block_time` (timestamptz, indexed) - Block timestamp
  - `instruction_type` (text, indexed) - Instruction type name
  - `success` (boolean) - Whether transaction succeeded
  - `error_message` (text, nullable) - Error message if failed
  - `accounts_involved` (text[]) - Array of account pubkeys involved
  - `processed` (boolean, indexed) - Whether indexer has processed this

  ### `indexer_state`
  Tracks indexer progress (single row, id=1)
  - `id` (int, primary key) - Always 1
  - `last_processed_signature` (text) - Most recent processed signature
  - `last_processed_slot` (bigint) - Most recent processed slot
  - `last_run_at` (timestamptz) - When indexer last ran

  ## Security

  All tables have RLS enabled with:
  - Public read access (anon, authenticated) - appropriate for public blockchain explorer
  - Service role write access - for indexer operations
*/

-- Drop all existing tables (cascade will drop dependent objects)
DROP TABLE IF EXISTS attestations CASCADE;
DROP TABLE IF EXISTS schemas CASCADE;
DROP TABLE IF EXISTS credentials CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS indexer_state CASCADE;

-- Create credentials table
CREATE TABLE credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pubkey text UNIQUE NOT NULL,
  authority text NOT NULL,
  name text NOT NULL,
  authorized_signers text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  signature text DEFAULT ''
);

CREATE INDEX idx_credentials_pubkey ON credentials(pubkey);
CREATE INDEX idx_credentials_authority ON credentials(authority);
CREATE INDEX idx_credentials_created_at ON credentials(created_at DESC);

-- Create schemas table
CREATE TABLE schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pubkey text UNIQUE NOT NULL,
  credential_pubkey text NOT NULL,
  credential_name text DEFAULT '',
  name text NOT NULL,
  description text DEFAULT '',
  layout jsonb NOT NULL,
  field_names text[] NOT NULL DEFAULT '{}',
  is_paused boolean DEFAULT false,
  version int DEFAULT 1,
  is_tokenized boolean DEFAULT false,
  tokenized_mint text,
  created_at timestamptz DEFAULT now(),
  signature text DEFAULT ''
);

CREATE INDEX idx_schemas_pubkey ON schemas(pubkey);
CREATE INDEX idx_schemas_credential_pubkey ON schemas(credential_pubkey);
CREATE INDEX idx_schemas_is_paused ON schemas(is_paused);
CREATE INDEX idx_schemas_is_tokenized ON schemas(is_tokenized);
CREATE INDEX idx_schemas_created_at ON schemas(created_at DESC);

ALTER TABLE schemas 
ADD CONSTRAINT fk_schemas_credential 
FOREIGN KEY (credential_pubkey) 
REFERENCES credentials(pubkey) 
ON DELETE CASCADE;

-- Create attestations table
CREATE TABLE attestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pubkey text UNIQUE NOT NULL,
  nonce text NOT NULL,
  credential_pubkey text NOT NULL,
  schema_pubkey text NOT NULL,
  schema_name text DEFAULT '',
  data_raw bytea NOT NULL,
  data_decoded jsonb,
  signer text NOT NULL,
  expiry bigint DEFAULT 0,
  is_tokenized boolean DEFAULT false,
  token_account text,
  attestation_mint text,
  is_closed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  signature text DEFAULT ''
);

CREATE INDEX idx_attestations_pubkey ON attestations(pubkey);
CREATE INDEX idx_attestations_nonce ON attestations(nonce);
CREATE INDEX idx_attestations_credential_pubkey ON attestations(credential_pubkey);
CREATE INDEX idx_attestations_schema_pubkey ON attestations(schema_pubkey);
CREATE INDEX idx_attestations_signer ON attestations(signer);
CREATE INDEX idx_attestations_is_closed ON attestations(is_closed);
CREATE INDEX idx_attestations_created_at ON attestations(created_at DESC);
CREATE INDEX idx_attestations_expiry ON attestations(expiry);

ALTER TABLE attestations 
ADD CONSTRAINT fk_attestations_credential 
FOREIGN KEY (credential_pubkey) 
REFERENCES credentials(pubkey) 
ON DELETE CASCADE;

ALTER TABLE attestations 
ADD CONSTRAINT fk_attestations_schema 
FOREIGN KEY (schema_pubkey) 
REFERENCES schemas(pubkey) 
ON DELETE CASCADE;

-- Create transactions table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signature text UNIQUE NOT NULL,
  slot bigint NOT NULL,
  block_time timestamptz NOT NULL,
  instruction_type text NOT NULL,
  success boolean DEFAULT true,
  error_message text,
  accounts_involved text[] DEFAULT '{}',
  processed boolean DEFAULT false
);

CREATE INDEX idx_transactions_signature ON transactions(signature);
CREATE INDEX idx_transactions_slot ON transactions(slot DESC);
CREATE INDEX idx_transactions_block_time ON transactions(block_time DESC);
CREATE INDEX idx_transactions_instruction_type ON transactions(instruction_type);
CREATE INDEX idx_transactions_processed ON transactions(processed);

-- Create indexer_state table
CREATE TABLE indexer_state (
  id int PRIMARY KEY DEFAULT 1,
  last_processed_signature text,
  last_processed_slot bigint DEFAULT 0,
  last_run_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO indexer_state (id, last_processed_signature, last_processed_slot, last_run_at)
VALUES (1, NULL, 0, now());

-- Enable RLS on all tables
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE indexer_state ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public can read credentials"
  ON credentials FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can read schemas"
  ON schemas FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can read attestations"
  ON attestations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can read transactions"
  ON transactions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can read indexer state"
  ON indexer_state FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role write policies
CREATE POLICY "Service role can insert credentials"
  ON credentials FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update credentials"
  ON credentials FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can insert schemas"
  ON schemas FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update schemas"
  ON schemas FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can insert attestations"
  ON attestations FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update attestations"
  ON attestations FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can insert transactions"
  ON transactions FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update transactions"
  ON transactions FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can update indexer state"
  ON indexer_state FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
