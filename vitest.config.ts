import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["**/__tests__/**/*.test.{ts,tsx}"],
    globalSetup: ["src/__tests__/helpers/global-setup.ts"],
    setupFiles: ["src/__tests__/helpers/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/app/api/**"],
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
    },
  },
});
