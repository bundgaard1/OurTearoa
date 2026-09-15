// Prisma CLI configuration (v7).
// The connection URL lives in environment variables, not in schema.prisma.
// Define DATABASE_URL in backend/.env (dev) or in the cloud runtime environment (production).
import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});