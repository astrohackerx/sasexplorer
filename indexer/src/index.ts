import { Connection, PublicKey, GetProgramAccountsFilter } from '@solana/web3.js';
import bs58 from 'bs58';
import { CONFIG } from './config.js';
import {
  decodeCredential,
  decodeSchema,
  decodeAttestation,
  DISCRIMINATORS,
} from './decoder.js';
import {
  insertCredentialsBatch,
  insertSchemasBatch,
  insertAttestationsBatch,
  getIndexerState,
  updateIndexerState,
} from './supabase.js';
import type { Credential, Schema, Attestation, Transaction } from './types.js';

const connection = new Connection(CONFIG.SOLANA_RPC_URL, 'confirmed');
const programId = new PublicKey(CONFIG.SAS_PROGRAM_ID);

async function scanNewTransactions(lastSlot: number, lastSignature: string | null): Promise<{ affectedAccounts: Set<string>, latestSlot: number, latestSignature: string | null }> {
  console.log(`\n🔍 Scanning for new transactions since slot ${lastSlot}...`);

  // Fetch latest transactions (they come in reverse chronological order - newest first)
  const allSignatures = await connection.getSignaturesForAddress(
    programId,
    { limit: 1000 },
    'confirmed'
  );

  // If we have a last signature, filter to only get newer transactions
  let signatures = allSignatures;
  if (lastSignature) {
    const lastIndex = allSignatures.findIndex(s => s.signature === lastSignature);
    if (lastIndex > 0) {
      // Only take transactions that came before this index (i.e., newer)
      signatures = allSignatures.slice(0, lastIndex);
    } else if (lastIndex === -1) {
      // Last signature not found in recent history, use all
      signatures = allSignatures;
    } else {
      // lastIndex === 0 means no new transactions
      signatures = [];
    }
  }

  console.log(`   Found ${signatures.length} new transactions`);

  const affectedAccounts = new Set<string>();
  let latestSlot = lastSlot;
  let latestSignature: string | null = null;

  for (const sigInfo of signatures) {
    if (sigInfo.slot > latestSlot) {
      latestSlot = sigInfo.slot;
      latestSignature = sigInfo.signature;
    }

    try {
      const tx = await connection.getTransaction(sigInfo.signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (tx?.transaction) {
        const accountKeys = tx.transaction.message.getAccountKeys();
        accountKeys.staticAccountKeys.forEach(key => {
          affectedAccounts.add(key.toBase58());
        });
      }
    } catch (error) {
      console.log(`   ⚠️  Failed to fetch transaction ${sigInfo.signature}`);
    }
  }

  console.log(`   Affected ${affectedAccounts.size} unique accounts`);
  return { affectedAccounts, latestSlot, latestSignature };
}

async function scanCredentials(affectedAccounts?: Set<string>): Promise<void> {
  console.log('\n🔍 Scanning for Credentials...');

  const filters: GetProgramAccountsFilter[] = [
    { memcmp: { offset: 0, bytes: bs58.encode(Buffer.from([DISCRIMINATORS.CREDENTIAL])) } }
  ];

  const accounts = await connection.getProgramAccounts(programId, {
    filters,
    commitment: 'confirmed',
  });

  console.log(`   Found ${accounts.length} credential accounts`);

  const credentials: Credential[] = [];

  for (const { pubkey, account } of accounts) {
    const pubkeyStr = pubkey.toBase58();

    if (affectedAccounts && !affectedAccounts.has(pubkeyStr)) {
      continue;
    }

    const decoded = decodeCredential(account.data);
    if (!decoded) {
      console.log(`   ⚠️  Failed to decode credential: ${pubkeyStr}`);
      continue;
    }

    const isPdaOwned = !PublicKey.isOnCurve(new PublicKey(decoded.authority).toBytes());

    const credential: Credential = {
      pubkey: pubkeyStr,
      authority: decoded.authority,
      name: decoded.name,
      authorized_signers: decoded.authorized_signers,
      is_pda_owned: isPdaOwned,
      signature: '',
    };

    credentials.push(credential);
    const pdaLabel = isPdaOwned ? ' [PDA]' : '';
    console.log(`   ✅ ${decoded.name}${pdaLabel} (${pubkeyStr.substring(0, 8)}...)`);
  }

  if (credentials.length > 0) {
    await insertCredentialsBatch(credentials);
    console.log(`   💾 Inserted ${credentials.length} credentials`);
  }
}

async function scanSchemas(affectedAccounts?: Set<string>): Promise<void> {
  console.log('\n🔍 Scanning for Schemas...');

  const filters: GetProgramAccountsFilter[] = [
    { memcmp: { offset: 0, bytes: bs58.encode(Buffer.from([DISCRIMINATORS.SCHEMA])) } }
  ];

  const accounts = await connection.getProgramAccounts(programId, {
    filters,
    commitment: 'confirmed',
  });

  console.log(`   Found ${accounts.length} schema accounts`);

  const schemas: Schema[] = [];

  for (const { pubkey, account } of accounts) {
    const pubkeyStr = pubkey.toBase58();

    if (affectedAccounts && !affectedAccounts.has(pubkeyStr)) {
      continue;
    }

    const decoded = decodeSchema(account.data);
    if (!decoded) {
      console.log(`   ⚠️  Failed to decode schema: ${pubkeyStr}`);
      continue;
    }

    const schema: Schema = {
      pubkey: pubkeyStr,
      credential_pubkey: decoded.credential,
      credential_name: '',
      name: decoded.name,
      description: decoded.description,
      layout: decoded.layout,
      field_names: decoded.field_names,
      is_paused: decoded.is_paused,
      version: decoded.version,
      is_tokenized: false,
      tokenized_mint: null,
      signature: '',
    };

    schemas.push(schema);
    console.log(`   ✅ ${decoded.name} (${pubkeyStr.substring(0, 8)}...)`);
  }

  if (schemas.length > 0) {
    await insertSchemasBatch(schemas);
    console.log(`   💾 Inserted ${schemas.length} schemas`);
  }
}

async function scanAttestations(affectedAccounts?: Set<string>): Promise<void> {
  console.log('\n🔍 Scanning for Attestations...');

  const filters: GetProgramAccountsFilter[] = [
    { memcmp: { offset: 0, bytes: bs58.encode(Buffer.from([DISCRIMINATORS.ATTESTATION])) } }
  ];

  const accounts = await connection.getProgramAccounts(programId, {
    filters,
    commitment: 'confirmed',
  });

  console.log(`   Found ${accounts.length} attestation accounts`);

  const BATCH_SIZE = 100;
  let attestations: Attestation[] = [];
  let processed = 0;
  let skipped = 0;

  for (const { pubkey, account } of accounts) {
    const pubkeyStr = pubkey.toBase58();

    if (affectedAccounts && !affectedAccounts.has(pubkeyStr)) {
      skipped++;
      continue;
    }

    const decoded = decodeAttestation(account.data);
    if (!decoded) {
      console.log(`   ⚠️  Failed to decode attestation: ${pubkeyStr}`);
      continue;
    }

    const attestation: Attestation = {
      pubkey: pubkeyStr,
      nonce: decoded.nonce,
      credential_pubkey: decoded.credential,
      schema_pubkey: decoded.schema,
      schema_name: '',
      data_raw: Buffer.from(decoded.data),
      data_decoded: null,
      signer: decoded.signer,
      expiry: Number(decoded.expiry),
      is_tokenized: decoded.token_account !== '11111111111111111111111111111111',
      token_account: decoded.token_account,
      attestation_mint: null,
      is_closed: false,
      signature: '',
    };

    attestations.push(attestation);
    processed++;

    if (attestations.length >= BATCH_SIZE) {
      await insertAttestationsBatch(attestations);
      console.log(`   💾 Inserted batch (${processed} processed, ${skipped} skipped)`);
      attestations = [];
    }
  }

  if (attestations.length > 0) {
    await insertAttestationsBatch(attestations);
  }

  console.log(`   ✅ Completed ${processed} attestations (${skipped} skipped)`);
}

async function main() {
  console.log('🚀 Starting SAS Indexer...');
  console.log(`   RPC: ${CONFIG.SOLANA_RPC_URL}`);
  console.log(`   Program: ${CONFIG.SAS_PROGRAM_ID}`);

  try {
    const state = await getIndexerState();
    console.log(`\n📊 Last processed slot: ${state.last_processed_slot}`);

    if (state.last_processed_slot === 0) {
      console.log('\n⚡ First run - performing full scan...');
      await scanCredentials();
      await scanSchemas();
      await scanAttestations();

      // Get the latest transaction signature for incremental updates
      const latestSignatures = await connection.getSignaturesForAddress(
        programId,
        { limit: 1 },
        'confirmed'
      );
      const latestSignature = latestSignatures.length > 0 ? latestSignatures[0].signature : '';
      const currentSlot = await connection.getSlot('confirmed');

      await updateIndexerState(latestSignature, currentSlot);
      console.log(`\n✅ Full scan complete! Updated to slot ${currentSlot}`);
    } else {
      console.log('\n⚡ Incremental update - scanning for new transactions...');
      const { affectedAccounts, latestSlot, latestSignature } = await scanNewTransactions(state.last_processed_slot, state.last_processed_signature);

      if (affectedAccounts.size > 0) {
        console.log('\n�� Updating affected accounts only...');
        await scanCredentials(affectedAccounts);
        await scanSchemas(affectedAccounts);
        await scanAttestations(affectedAccounts);

        await updateIndexerState(latestSignature || '', latestSlot);
        console.log(`\n✅ Incremental update complete! Updated to slot ${latestSlot}`);
      } else {
        console.log('\n✅ No new transactions found!');
      }
    }
  } catch (error) {
    console.error('❌ Error during scan:', error);
    process.exit(1);
  }
}

async function runContinuously() {
  console.log('🔄 Running in continuous mode (every 60 seconds)');

  while (true) {
    await main();
    console.log('\n⏳ Waiting 60 seconds until next run...\n');
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
}

// Check if we should run continuously or just once
const runMode = process.env.RUN_MODE || 'once';
if (runMode === 'continuous') {
  runContinuously();
} else {
  main();
}
