import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

// Database connection configuration
// Note: In Cloudflare Workers, process.env might not be populated at top-level.
// We allow empty string to prevent crash on module load.
const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  console.warn('Warning: DATABASE_URL is missing in process.env. DB queries will fail.');
}

// Create Neon pool
const client = new Pool({ connectionString });

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export the client for manual queries if needed
export { client };

// Type exports
export type Database = typeof db;