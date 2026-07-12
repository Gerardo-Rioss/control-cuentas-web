/**
 * Test database helpers.
 *
 * Uses the same PrismaClient singleton from `@/lib/prisma`.
 * By the time this module loads, `setup.ts` has already set
 * `DATABASE_URL` to the test database.
 */
import { prisma } from "@/lib/prisma";

/**
 * Truncate all tables in FK-safe order using PostgreSQL TRUNCATE CASCADE.
 * Tables: movements, categories, users, accounts, sessions, verification_tokens
 */
export async function truncateAll(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "movements", "categories", "users", "accounts", "sessions", "verification_tokens" CASCADE`,
  );
}

export { prisma };
