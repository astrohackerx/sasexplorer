import { config } from 'dotenv';

config();

export const CONFIG = {
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  SAS_PROGRAM_ID: '22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG',
  INDEXER_INTERVAL_MS: parseInt(process.env.INDEXER_INTERVAL_MS || '60000'),
  BATCH_SIZE: 100,
};

if (!CONFIG.SUPABASE_URL) {
  throw new Error('VITE_SUPABASE_URL is required');
}

if (!CONFIG.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY not set. You need to add it to .env file.');
}

console.log('Config loaded:');
console.log('  SUPABASE_URL:', CONFIG.SUPABASE_URL);
console.log('  SERVICE_KEY length:', CONFIG.SUPABASE_SERVICE_ROLE_KEY?.length || 0);
console.log('  SERVICE_KEY starts with:', CONFIG.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');
