import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client.js';

export const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl(),
  }),
});

export type Db = typeof prisma;

/**
 * Resolves the Postgres connection string.
 * Set DATABASE_URL in backend/.env for local development, or in the
 * cloud runtime environment (EC2 / PM2 / secrets manager) in production.
 *
 * For AWS RDS add the CA bundle so TLS verification succeeds:
 *   ?sslmode=verify-full&sslrootcert=<path-to-global-bundle.pem>
 */
function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add it to backend/.env or the runtime environment.'
    );
  }
  return url;
}