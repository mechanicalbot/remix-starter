import { mergeConfig } from "vite";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../app/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-links",
    {
      name: "@storybook/addon-essentials",
      options: {},
    },
    "@storybook/addon-interactions",
  ],
  core: {
    disableTelemetry: true,
  },
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  async viteFinal(config) {
    return mergeConfig(config, {});
    // return mergeConfig(config, {
    //   plugins: [tsconfigPaths()],
    //   resolve: {
    //     alias: {
    //       // prettier-ignore
    //       "@remix-run/react/dist/components": "@remix-run/react/dist/esm/components",
    //       ".prisma/client/index-browser":
    //         "./node_modules/.prisma/client/index-browser.js",
    //     },
    //   },
    // });
  },
};
export default config;
