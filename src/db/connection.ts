import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

// Database connection configuration for Cloudflare Workers
// We need to create fresh connections for each request to avoid I/O issues

const createClient = () => {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    // Debug information
    const envKeys = Object.keys(process.env).filter(key => 
      key.includes('DATABASE') || key.includes('URL') || key.includes('NEON')
    );
    
    throw new Error(
      `DATABASE_URL is missing from process.env. ` +
      `Available env keys with DATABASE/URL/NEON: [${envKeys.join(', ')}]. ` +
      `All env keys: [${Object.keys(process.env).join(', ')}]. ` +
      `Make sure DATABASE_URL secret is set with: npx wrangler secret put DATABASE_URL`
    );
  }

  console.log('Creating database connection with URL:', connectionString.substring(0, 20) + '...');
  return new Pool({ connectionString });
};

const createDb = () => {
  return drizzle(createClient(), { schema });
};

// Export function that creates fresh DB instance for each request
export const getDb = () => {
  return createDb();
};

// Export function that creates fresh client for each request
export const getClient = () => {
  return createClient();
};

// For backward compatibility - but this creates fresh instances each time
// This avoids the I/O sharing issue in Cloudflare Workers
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (_target, prop) => {
    return (createDb() as any)[prop];
  },
});

export const client = new Proxy({} as Pool, {
  get: (_target, prop) => {
    return (createClient() as any)[prop];
  },
});

// Type exports
export type Database = typeof db;