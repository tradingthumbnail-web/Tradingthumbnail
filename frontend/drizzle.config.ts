import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
    dialect: 'postgresql',
    out: './server/database/migrations',
    schema: './server/database/schemas',
    dbCredentials: {
        url: process.env.NUXT_DATABASE_CONNECTION_STRING || 'postgresql://postgres:postgres@localhost:5432/kithumbs-db',
    },
});