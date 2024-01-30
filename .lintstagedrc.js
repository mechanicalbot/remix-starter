export default {
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{ts,tsx}": () => "tsc -p tsconfig.json --noEmit",
};
