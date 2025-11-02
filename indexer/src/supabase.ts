import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CONFIG } from './config.js';
import type { Credential, Schema, Attestation, Transaction } from './types.js';

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabase;
}

export async function getIndexerState(): Promise<{
  last_processed_signature: string | null;
  last_processed_slot: number;
}> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('indexer_state')
    .select('last_processed_signature, last_processed_slot')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching indexer state:', error);
    return { last_processed_signature: null, last_processed_slot: 0 };
  }

  if (!data) {
    return { last_processed_signature: null, last_processed_slot: 0 };
  }

  return {
    last_processed_signature: data.last_processed_signature,
    last_processed_slot: data.last_processed_slot || 0,
  };
}

export async function updateIndexerState(signature: string, slot: number): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('indexer_state')
    .update({
      last_processed_signature: signature,
      last_processed_slot: slot,
      last_run_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (error) {
    console.error('Error updating indexer state:', error);
    throw error;
  }
}

export async function insertCredential(credential: Credential): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('credentials')
    .upsert(credential, { onConflict: 'pubkey' });

  if (error) {
    console.error('Error inserting credential:', error);
    throw error;
  }
}

export async function insertCredentialsBatch(credentials: Credential[]): Promise<void> {
  if (credentials.length === 0) return;

  const client = getSupabaseClient();
  const { error } = await client
    .from('credentials')
    .upsert(credentials, { onConflict: 'pubkey' });

  if (error) {
    console.error('Error inserting credentials batch:', error);
    throw error;
  }
}

export async function insertSchema(schema: Schema): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('schemas')
    .upsert(schema, { onConflict: 'pubkey' });

  if (error) {
    console.error('Error inserting schema:', error);
    throw error;
  }
}

export async function insertSchemasBatch(schemas: Schema[]): Promise<void> {
  if (schemas.length === 0) return;

  const client = getSupabaseClient();
  const { error } = await client
    .from('schemas')
    .upsert(schemas, { onConflict: 'pubkey' });

  if (error) {
    console.error('Error inserting schemas batch:', error);
    throw error;
  }
}

export async function updateSchemaTokenization(
  pubkey: string,
  tokenized_mint: string
): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('schemas')
    .update({
      is_tokenized: true,
      tokenized_mint,
    })
    .eq('pubkey', pubkey);

  if (error) {
    console.error('Error updating schema tokenization:', error);
    throw error;
  }
}

export async function insertAttestation(attestation: Attestation): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('attestations')
    .upsert(attestation, { onConflict: 'pubkey' });

  if (error) {
    console.error('Error inserting attestation:', error);
    throw error;
  }
}

export async function insertAttestationsBatch(attestations: Attestation[]): Promise<void> {
  if (attestations.length === 0) return;

  const client = getSupabaseClient();
  const { error } = await client
    .from('attestations')
    .upsert(attestations, { onConflict: 'pubkey' });

  if (error) {
    console.error('Error inserting attestations batch:', error);
    throw error;
  }
}

export async function closeAttestation(pubkey: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('attestations')
    .update({
      is_closed: true,
      closed_at: new Date().toISOString(),
    })
    .eq('pubkey', pubkey);

  if (error) {
    console.error('Error closing attestation:', error);
    throw error;
  }
}

export async function insertTransaction(transaction: Transaction): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('transactions')
    .upsert(transaction, { onConflict: 'signature' });

  if (error) {
    console.error('Error inserting transaction:', error);
    throw error;
  }
}

export async function getCredentialByPubkey(pubkey: string): Promise<Credential | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('credentials')
    .select('*')
    .eq('pubkey', pubkey)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Credential;
}

export async function getSchemaByPubkey(pubkey: string): Promise<Schema | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('schemas')
    .select('*')
    .eq('pubkey', pubkey)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Schema;
}
