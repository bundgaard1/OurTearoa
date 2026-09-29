import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client.js';

let client: PrismaClient | undefined;

/**
 * Returns the shared Prisma client, constructing it on first use.
 *
 * Construction is deferred so that a missing DATABASE_URL surfaces as a
 * recoverable health-check failure rather than crashing the process at
 * import time. Every caller must handle the throw.
 */
export function getPrisma(): PrismaClient {
  client ??= new PrismaClient({
    adapter: new PrismaPg({
      connectionString: databaseUrl(),
    }),
  });
  return client;
}

export type Db = PrismaClient;

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
