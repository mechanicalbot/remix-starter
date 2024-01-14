/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },

  // Base config
  extends: ["eslint:recommended"],

  overrides: [
    // React
    {
      files: ["**/*.{mjs,js,jsx,ts,tsx}"],
      plugins: ["react", "jsx-a11y"],
      extends: [
        "plugin:react/recommended",
        "plugin:react/jsx-runtime",
        "plugin:react-hooks/recommended",
        "plugin:jsx-a11y/recommended",
        "prettier",
      ],
      settings: {
        react: {
          version: "detect",
        },
        formComponents: ["Form"],
        linkComponents: [
          { name: "Link", linkAttribute: "to" },
          { name: "NavLink", linkAttribute: "to" },
        ],
        "import/resolver": {
          typescript: {},
        },
      },
      rules: {
        "react/jsx-no-leaked-render": [
          "warn",
          { validStrategies: ["ternary", "coerce"] },
        ],
        "react/prop-types": "off",
      },
    },

    // Typescript
    {
      files: ["**/*.{mjs,js,jsx,ts,tsx}"],
      plugins: ["@typescript-eslint", "import"],
      parser: "@typescript-eslint/parser",
      settings: {
        "import/internal-regex": "^~/",
        "import/resolver": {
          node: {
            extensions: [".ts", ".tsx"],
          },
          typescript: {
            alwaysTryTypes: true,
          },
        },
      },
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/stylistic",
        "plugin:import/recommended",
        "plugin:import/typescript",
        "prettier",
        "plugin:storybook/recommended",
      ],
      rules: {
        "@typescript-eslint/consistent-type-imports": [
          "warn",
          {
            prefer: "type-imports",
            disallowTypeAnnotations: true,
            fixStyle: "inline-type-imports",
          },
        ],
        "import/no-duplicates": ["warn", { "prefer-inline": true }],
        "import/consistent-type-specifier-style": ["warn", "prefer-inline"],
        "import/order": [
          "warn",
          {
            "newlines-between": "always",
            alphabetize: { order: "asc", caseInsensitive: true },
            groups: [
              "builtin",
              "external",
              "internal",
              "parent",
              "sibling",
              "index",
            ],
          },
        ],
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_" },
        ],
        "object-shorthand": ["error", "always"],
        "@typescript-eslint/no-empty-function": "off",
        "no-restricted-imports": [
          "error",
          {
            name: "@playwright/test",
            message: 'Please use "~/tests/playwright" instead.',
          },
        ],
        "@typescript-eslint/consistent-type-definitions": "off",
        "@typescript-eslint/no-empty-interface": [
          "warn",
          { allowSingleExtends: true },
        ],
        "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
      },
    },

    // Jest/Vitest
    {
      files: ["app/**/*.{test,spec}.{mjs,js,jsx,ts,tsx}"],
      plugins: ["jest", "jest-dom", "testing-library"],
      extends: [
        "plugin:jest/recommended",
        "plugin:jest-dom/recommended",
        "plugin:testing-library/react",
        "prettier",
      ],
      env: {
        "jest/globals": true,
      },
      settings: {
        jest: {
          version: 28, // explicitly set for vitest
        },
      },
    },

    // Node
    {
      files: [".eslintrc.js", "index.mjs", "server/**/*.{mjs,js,jsx,ts,tsx}"],
      env: {
        node: true,
      },
    },
  ],
};
