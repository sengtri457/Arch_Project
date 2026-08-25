import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const typeScriptOverrides = {
  "@typescript-eslint/no-explicit-any": "off",
  "@typescript-eslint/no-unused-vars": [
    "warn",
    { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
  ],
};

const coreWebVitalsOverrides = {
  "react/no-unescaped-entities": "warn",
  "react-hooks/set-state-in-effect": "warn",
  "react-hooks/static-components": "warn",
  "react-hooks/immutability": "warn",
};

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "supabase/functions/**",
      "scratch/**",
      "scripts/**",
      ".agents/**",
    ],
  },
  ...coreWebVitals.map((config) => ({
    ...config,
    rules: { ...config.rules, ...coreWebVitalsOverrides },
  })),
  ...typescript.map((config) => ({
    ...config,
    rules: { ...config.rules, ...typeScriptOverrides },
  })),
];

export default eslintConfig;
