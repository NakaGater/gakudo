import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  timeout: 30000,
  retries: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"], ["list"]] : "list",
  // Auto-start the Next.js server. Locally we reuse a dev server if one
  // is already running (`npm run dev` in another tab); in CI we always
  // build+start fresh so the client-bundled NEXT_PUBLIC_SUPABASE_URL
  // points at the just-started local Supabase stack.
  webServer: {
    command: process.env.CI ? "npm run build && npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
