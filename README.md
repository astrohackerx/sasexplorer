# Solana Attestation Service (SAS) Explorer

A comprehensive blockchain explorer for the Solana Attestation Service, featuring a modern web interface and automated indexer for real-time data synchronization.

## Overview

The SAS Explorer provides a user-friendly interface to browse and explore credentials, schemas, and attestations on the Solana Attestation Service program. The project consists of two main components:

- **Frontend**: React-based web application for browsing SAS data
- **Indexer**: Node.js service that monitors the blockchain and syncs data to the database

## Features

### Frontend Explorer

- **Credential Browser**: View all issuer credentials with authority information and authorized signers
- **Schema Explorer**: Browse attestation schemas with detailed field definitions and layouts
- **Attestation Viewer**: Explore individual attestations with decoded data and raw hex views
- **Search & Filter**: Search across all entities with real-time filtering
- **Detail Pages**: Deep-dive into any credential, schema, or attestation with comprehensive information
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional interface with subtle animations and premium feel

### Indexer Service

- **Real-time Synchronization**: Continuously monitors the SAS program for new activity
- **Incremental Updates**: Efficient processing of only changed accounts
- **Full Historical Scan**: Indexes all existing program accounts on first run
- **Automatic Retries**: Built-in retry logic for rate-limited RPC calls
- **State Management**: Tracks processing state to resume from last position
- **Batch Processing**: Handles large datasets efficiently

## Architecture

```
┌─────────────────┐
│  Solana Chain   │
│  (SAS Program)  │
└────────┬────────┘
         │
         │ RPC
         ▼
┌─────────────────┐
│     Indexer     │ ◄──── Runs continuously/cron
│   (Node.js)     │
└────────┬────────┘
         │
         │ Updates
         ▼
┌─────────────────┐
│    Supabase     │
│    Database     │
└────────┬────────┘
         │
         │ Queries
         ▼
┌─────────────────┐
│    Frontend     │
│     (React)     │
└─────────────────┘
```

## Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Supabase JS** - Database client
- **Geist Mono Font** - Modern monospace typography

### Indexer
- **Node.js** - Runtime environment
- **TypeScript** - Type-safe development
- **@solana/web3.js** - Solana blockchain interaction
- **Borsher** - Borsh serialization for account decoding
- **Supabase JS** - Database operations
- **dotenv** - Environment configuration

### Database
- **Supabase (PostgreSQL)** - Serverless database with Row Level Security

## Project Structure

```
.
├── frontend/              # Web application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and types
│   │   └── assets/        # Static assets
│   ├── public/            # Public assets
│   └── package.json
│
├── indexer/               # Blockchain indexer
│   ├── src/
│   │   ├── index.ts       # Main indexer logic
│   │   ├── decoder.ts     # Account decoding
│   │   ├── supabase.ts    # Database operations
│   │   ├── config.ts      # Configuration
│   │   └── types.ts       # Type definitions
│   └── package.json
│
└── README.md              # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Solana RPC endpoint (recommend Helius, QuickNode, or Alchemy)

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)

2. Run the database migration located in:
   ```
   frontend/supabase/migrations/20251102194432_create_sas_explorer_schema.sql
   ```

3. Note your Supabase URL and service role key from the project settings

### Environment Configuration

Create `.env` files in both `frontend` and `indexer` directories:

**frontend/.env**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**indexer/.env**
```env
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_api_key
SAS_PROGRAM_ID=22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`

For production build:
```bash
npm run build
npm run preview
```

### Indexer Setup

```bash
cd indexer
npm install
npm start
```

For continuous monitoring:
```bash
npm run start:continuous
```

For development with auto-reload:
```bash
npm run dev
```

## Deployment

### Frontend Deployment

The frontend can be deployed to any static hosting service:

- **Vercel**: `vercel --prod`
- **Netlify**: Connect GitHub repo and deploy
- **AWS S3 + CloudFront**: Build and upload to S3
- **GitHub Pages**: Use GitHub Actions workflow

Build the production bundle:
```bash
cd frontend
npm run build
```

The `dist` folder contains the production-ready files.

### Indexer Deployment

The indexer should run on a server with continuous uptime:

#### Option 1: Cron Job (Recommended for lower traffic)
```bash
# Run every 2 minutes
*/2 * * * * cd /path/to/indexer && npm start >> /var/log/sas-indexer.log 2>&1
```

#### Option 2: Continuous Process (Recommended for high traffic)
```bash
# Run as a background service
npm run start:continuous &

# Or use PM2
npm install -g pm2
pm2 start npm --name "sas-indexer" -- run start:continuous
pm2 save
pm2 startup
```

#### Option 3: Docker Container
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
CMD ["npm", "run", "start:continuous"]
```

#### Hosting Providers
- DigitalOcean Droplets
- AWS EC2
- Google Cloud Compute Engine
- Heroku
- Railway

## Database Schema

### Tables

**credentials**
- `address` (text, primary key) - Credential account address
- `authority` (text) - Authority public key
- `authorized_signers` (text[]) - Array of authorized signer addresses
- `created_at` (timestamp) - Record creation time
- `updated_at` (timestamp) - Last update time

**schemas**
- `address` (text, primary key) - Schema account address
- `credential` (text) - Associated credential address
- `revision` (integer) - Schema version number
- `description` (text) - Human-readable description
- `layout` (text) - Borsh serialization layout
- `field_names` (text[]) - Array of field names
- `created_at` (timestamp) - Record creation time
- `updated_at` (timestamp) - Last update time

**attestations**
- `address` (text, primary key) - Attestation account address
- `schema` (text) - Schema address
- `status` (integer) - Attestation status (0 = active, 1 = revoked)
- `data` (bytea) - Raw attestation data
- `decoded_data` (jsonb) - Decoded attestation data
- `created_at` (timestamp) - Record creation time
- `updated_at` (timestamp) - Last update time

**indexer_state**
- `id` (integer, primary key) - State ID (always 1)
- `last_processed_signature` (text) - Last processed transaction signature
- `last_processed_slot` (bigint) - Last processed slot number
- `updated_at` (timestamp) - Last update time

### Indexes

- `idx_credentials_authority` - Fast credential lookup by authority
- `idx_schemas_credential` - Fast schema lookup by credential
- `idx_attestations_schema` - Fast attestation lookup by schema
- `idx_attestations_status` - Fast filtering by status

## API Reference

### Supabase Queries

The frontend uses the Supabase JavaScript client for all database operations:

**Fetch all credentials:**
```typescript
const { data, error } = await supabase
  .from('credentials')
  .select('*')
  .order('created_at', { ascending: false });
```

**Fetch credential by address:**
```typescript
const { data, error } = await supabase
  .from('credentials')
  .select('*')
  .eq('address', address)
  .maybeSingle();
```

**Search schemas:**
```typescript
const { data, error } = await supabase
  .from('schemas')
  .select('*')
  .ilike('description', `%${query}%`)
  .order('created_at', { ascending: false });
```

## Development

### Frontend Development

```bash
cd frontend
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Indexer Development

```bash
cd indexer
npm run dev      # Run with auto-reload
npm run build    # Compile TypeScript
npm start        # Run production build
```

### Database Migrations

To make schema changes:

1. Create a new migration file in `frontend/supabase/migrations/`
2. Write SQL DDL statements
3. Apply the migration in Supabase dashboard or CLI

## Monitoring

### Indexer Health Checks

Monitor the indexer with these metrics:

- **Processing lag**: Time between last slot and current slot
- **Error rate**: Number of failed attempts
- **Processing speed**: Accounts processed per minute
- **Database growth**: New records per hour

### Logs

Indexer logs important events:
- New transactions found
- Accounts updated
- Errors and retries
- Processing completion

Redirect logs to a file:
```bash
npm start >> indexer.log 2>&1
```

## Troubleshooting

### Frontend Issues

**Blank page after deployment**
- Check that environment variables are set correctly
- Verify Supabase URL and anon key
- Check browser console for errors

**Slow loading**
- Verify database indexes are created
- Check network tab for slow queries
- Consider pagination for large datasets

### Indexer Issues

**429 Rate Limit Errors**
- Use a premium RPC provider (Helius recommended)
- Increase delay between requests
- Check RPC provider rate limits

**Processing stops or hangs**
- Check RPC endpoint connectivity
- Verify Supabase credentials
- Review error logs for details

**Missing recent data**
- Ensure indexer is running continuously
- Check last processed signature in database
- Verify SAS program ID is correct

## Performance Optimization

### Frontend
- Implement pagination for large lists
- Add virtual scrolling for long tables
- Cache frequently accessed data
- Use CDN for static assets

### Indexer
- Use connection pooling for database
- Batch database operations
- Increase RPC rate limits
- Consider multiple indexer instances for redundancy

## Security Considerations

- **API Keys**: Never commit API keys or secrets to version control
- **RLS Policies**: Database uses Row Level Security (public read-only access)
- **Service Role**: Indexer uses service role key (never expose to frontend)
- **HTTPS**: Always use HTTPS in production
- **CORS**: Configure appropriate CORS policies

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Test thoroughly
5. Submit a pull request

## Resources

- [Solana Attestation Service Documentation](https://attest.solana.com/docs)
- [Solana Attestation Service GitHub](https://github.com/solana-foundation/solana-attestation-service)
- [Supabase Documentation](https://supabase.com/docs)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [React Documentation](https://react.dev)

## License

This project is open source and available under the MIT License.

## Support

For questions or issues:
- Open an issue on GitHub
- Check the documentation at [attest.solana.com/docs](https://attest.solana.com/docs)
- Review the SAS GitHub repository

## Acknowledgments

Built for the Solana Attestation Service ecosystem. Special thanks to the Solana Foundation and the SAS development team.
