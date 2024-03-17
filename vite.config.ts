/// <reference types="vitest" />
import devServer, { defaultOptions } from "@hono/vite-dev-server";
import { vitePlugin as remix } from "@remix-run/dev";
import { flatRoutes } from "remix-flat-routes";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const isStorybook = process.argv[1]?.includes("storybook");

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    !isStorybook &&
      process.env.NODE_ENV !== "test" &&
      remix({
        serverBuildFile: "remix.js",
        ignoredRouteFiles: ["**/*"],
        routes: async (defineRoutes) => {
          const routes = flatRoutes("routes", defineRoutes, {
            ignoredRouteFiles: [
              "**/*.test.tsx",
              "**/*.spec.tsx",
              "**/*.story.tsx",
              "**/*.stories.tsx",
            ],
          });

          return routes;
        },
      }),
    tsconfigPaths(),
    !isStorybook &&
      devServer({
        injectClientScript: false,
        entry: "./server/index.ts",
        exclude: [/^\/(app)\/.+/, ...defaultOptions.exclude],
      }),
  ],
  test: {
    include: ["./app/**/*.{test,spec}.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["./tests/setup/setup-test-env.ts"],
    globalSetup: ["./tests/setup/global-setup.ts"],
    coverage: {
      include: ["app/**/*.{ts,tsx}"],
      all: true,
    },
  },
});
