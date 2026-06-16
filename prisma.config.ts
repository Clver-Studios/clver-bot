import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, env } from 'prisma/config';
import dotenv from 'dotenv';

// Step 1: Hydrate runtime keys for local CLI utilities
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Step 2: Export your path layouts and connection URLs cleanly
export default defineConfig({
    schema: path.join(__dirname, 'prisma', 'schema.prisma'),
    datasource: {
        url: env('DATABASE_URL'),
    },
});