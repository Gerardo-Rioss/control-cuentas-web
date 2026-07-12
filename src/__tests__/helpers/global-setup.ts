/**
 * Global setup for Vitest — runs ONCE before all test files.
 * Sets DATABASE_URL to the test DB and applies Prisma migrations.
 *
 * This runs in the main process, NOT in worker threads.
 */
import { execSync } from "child_process";

export async function setup() {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    "postgresql://test:test@localhost:5433/control-cuentas-test";

  console.log("[global-setup] Applying migrations to test database...");

  try {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: "pipe",
      timeout: 30_000,
    });
    console.log("[global-setup] Migrations applied successfully.");
  } catch (err) {
    console.error(
      "[global-setup] Failed to apply migrations. Is the Docker container running?",
    );
    console.error(
      "[global-setup] Run: docker compose -f docker-compose.test.yml up -d",
    );
    throw err;
  }
}

export async function teardown() {
  // No-op: the Docker container stays up for manual inspection.
  // Run `docker compose -f docker-compose.test.yml down` to tear down.
}
