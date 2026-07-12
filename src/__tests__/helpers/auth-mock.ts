/**
 * Auth mock helpers.
 *
 * Usage in test files:
 * ```ts
 * vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
 * import { auth } from "@/lib/auth";
 * import { createSession } from "@/__tests__/helpers/auth-mock";
 *
 * beforeEach(() => {
 *   vi.mocked(auth).mockResolvedValue(createSession());
 * });
 * ```
 */

export interface TestUser {
  id: string;
  name: string;
  email: string;
}

export interface TestSession {
  user: TestUser;
}

/**
 * Create a session object for the auth mock.
 * Default user is "test-user-1".
 */
export function createSession(overrides?: Partial<TestUser>): TestSession {
  return {
    user: {
      id: overrides?.id ?? "test-user-1",
      name: overrides?.name ?? "Test User",
      email: overrides?.email ?? "test@example.com",
    },
  };
}

/**
 * Convenience: create a session with a different user ID
 * (for ownership isolation tests).
 */
export function createSessionForUser(userId: string): TestSession {
  return createSession({ id: userId, name: `User ${userId}` });
}
