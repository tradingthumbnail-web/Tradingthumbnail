import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
    dialect: 'postgresql',
    out: './server/database/migrations',
    schema: './server/database/schemas',
    dbCredentials: {
        // Local fallback is only for developer convenience; production must provide NUXT_DATABASE_CONNECTION_STRING.
        url: process.env.NUXT_DATABASE_CONNECTION_STRING || 'postgresql://postgres:postgres@localhost:5432/clicklab-db',
    },
});