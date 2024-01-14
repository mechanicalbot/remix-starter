import { unstable_vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    // @ts-expect-error - remix is not typed
    process.env.NODE_ENV === "storybook"
      ? null
      : remix({
          ignoredRouteFiles: [
            "**/*.test.tsx",
            "**/*.spec.tsx",
            "**/*.story.tsx",
            "**/*.stories.tsx",
          ],
        }),
    tsconfigPaths(),
  ],
});
