# SAS Indexer

Blockchain indexer for the Solana Attestation Service (SAS) program.

## Overview

This indexer monitors the SAS program on Solana mainnet, decodes all program accounts (Credentials, Schemas, and Attestations), and stores them in a Supabase database for the explorer frontend.

## Features

- **Incremental updates**: Only processes new transactions since last run
- **Full scan on first run**: Indexes all existing program accounts
- **Efficient filtering**: Only updates accounts affected by new transactions
- **Batch processing**: Handles large datasets efficiently
- **Automatic retries**: Built-in retry logic for rate-limited RPC calls
- **State tracking**: Resumes from last processed signature and slot

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_api_key
SAS_PROGRAM_ID=22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG
```

3. Run the indexer:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## How It Works

### First Run (Full Scan)
1. Fetches all program accounts using discriminator filters
2. Decodes and stores all Credentials, Schemas, and Attestations
3. Records the latest transaction signature and slot number

### Subsequent Runs (Incremental)
1. Fetches up to 1000 most recent transactions
2. Filters to only NEW transactions since last processed signature
3. Identifies affected accounts from transaction data
4. Only re-scans and updates those specific affected accounts
5. Updates state with new signature and slot

This approach is highly efficient - instead of re-scanning all program accounts, it only updates accounts that have changed.

## Database Schema

Tables populated by the indexer:

- **credentials**: Issuer credentials with authority and authorized signers
- **schemas**: Schema definitions with layout, field names, and version info
- **attestations**: Individual attestations with raw and decoded data
- **indexer_state**: Tracks last processed signature and slot

## Configuration

Environment variables:

- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (required for write access)
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `SOLANA_RPC_URL`: Solana RPC endpoint (use a premium provider like Helius)
- `SAS_PROGRAM_ID`: The SAS program ID

## Account Types

The indexer processes three account types by discriminator:

- **Credential (218)**: Issuer identity and authorized signers
- **Schema (180)**: Attestation templates with field definitions
- **Attestation (68)**: Individual attestations with encoded data

## Deployment

Recommended setup for production:

1. **Premium RPC provider**: Use Helius, QuickNode, or Alchemy for reliability
2. **Cron job**: Run the indexer every 1-5 minutes via cron
3. **Monitoring**: Set up alerts for failures or processing delays
4. **VPS hosting**: Deploy on DigitalOcean, AWS, or Google Cloud

Example cron (runs every 2 minutes):
```bash
*/2 * * * * cd /path/to/indexer && /usr/bin/npm start >> /var/log/sas-indexer.log 2>&1
```

## Troubleshooting

**429 Rate Limit Errors**
- The indexer has built-in retries with exponential backoff
- Use a premium RPC provider for higher rate limits
- Consider reducing scan frequency

**"Found 1000 new transactions" repeatedly**
- Check that `last_processed_signature` is being stored correctly
- Verify the signature exists in recent transaction history
- May indicate very high program activity (>1000 txs between runs)

**No new transactions detected**
- This is normal when there's no recent program activity
- The indexer will continue on next run

**Decoding errors**
- Verify the program ID matches the deployed SAS program
- Check that account discriminators match current program version
- Account data may be malformed or from a different program version

## Scripts

- `npm start`: Run indexer once and exit
- `npm run dev`: Run with file watching (auto-reloads on changes)
- `npm run build`: Compile TypeScript to JavaScript
