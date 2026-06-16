import { PrismaClient } from '@prisma/client';

// Initialize the standard client. It natively pulls DATABASE_URL from your process environment.
export const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'production' 
        ? ['error'] 
        : ['query', 'info', 'warn', 'error'],
});

// Verify connection capability on application bootstrap
export async function connectDatabase(): Promise<void> {
    try {
        await prisma.$connect();
        console.log('Database Engine: Connected successfully to the PostgreSQL cluster.');
    } catch (error) {
        console.error('Database Engine Fail: Could not safely bind connections.', error);
        process.exit(1);
    }
}