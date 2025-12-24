import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

// Database connection configuration
const connectionString = process.env.DATABASE_URL!;

// Create Neon pool
const client = new Pool({ connectionString });

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export the client for manual queries if needed
export { client };

// Type exports
export type Database = typeof db;