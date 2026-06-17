import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';

// Step 1: Hydrate runtime keys for local CLI utilities
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Step 2: Extract key parameter dynamically using native process streams
const databaseConnectionUrl = process.env.DATABASE_URL || "postgresql://malformed_fallback_string_for_build_checks:5432";

// Step 3: Export your path layouts and connection URLs cleanly
export default defineConfig({
    schema: path.join(__dirname, 'prisma', 'schema.prisma'),
    datasource: {
        // FIXED: Using raw string evaluation safely completely detaches the builder from compiler panic locks
        url: databaseConnectionUrl,
    },
});