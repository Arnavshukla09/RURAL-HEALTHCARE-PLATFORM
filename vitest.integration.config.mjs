import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    exclude: ["tests/unit/**", "tests/e2e.spec.ts", "node_modules/**"],
  },
  resolve: {
    alias: {
      "@": process.cwd(),
    },
  },
})
