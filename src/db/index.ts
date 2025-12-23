// Main database exports
export { db, client } from './connection';
export * from './schema';
export * from './utils';

// Re-export commonly used Drizzle functions
export { eq, and, or, not, isNull, isNotNull, like, ilike, desc, asc } from 'drizzle-orm';