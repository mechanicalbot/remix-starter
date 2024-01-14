/** @type {import("prettier").Options} */
export default {
  semi: true,
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindConfig: "./tailwind.config.ts",
  tailwindFunctions: ["cn"],
};
