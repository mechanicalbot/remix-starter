import devServer, { defaultOptions } from "@hono/vite-dev-server";
import { unstable_vitePlugin as remix } from "@remix-run/dev";
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
    devServer({
      injectClientScript: false,
      entry: "./server/index.ts",
      exclude: [/^\/(app)\/.+/, ...defaultOptions.exclude],
    }),
  ],
});
