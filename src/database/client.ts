import { PrismaClient } from '@prisma/client';

// Instantiate standard client relying cleanly on environment hydration parameters
export const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
});

export async function connectDatabase(): Promise<void> {
    try {
        await prisma.$connect();
        console.log('Database Engine: Connected successfully to the PostgreSQL cluster.');
    } catch (error) {
        console.error('Database Engine Fail: Could not safely bind connections.', error);
        process.exit(1);
    }
}