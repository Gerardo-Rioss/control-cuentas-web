/**
 * Worker-level setup — runs before every test file in the worker context.
 * Sets DATABASE_URL so `@/lib/prisma` connects to the test database.
 */
const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  "postgresql://test:test@localhost:5433/control-cuentas-test";

process.env.DATABASE_URL = testDbUrl;
