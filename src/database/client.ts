import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7's "client" engine type requires an explicit driver adapter —
// it does not fall back to a built-in query engine binary.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Instantiate standard client relying cleanly on environment hydration parameters
export const prisma = new PrismaClient({
    adapter,
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