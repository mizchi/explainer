import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/fixtures/**"],
    // Several files drive Chromium; one browser per core makes a small CI box swap.
    pool: "forks",
    maxWorkers: 4,
    minWorkers: 1,
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
