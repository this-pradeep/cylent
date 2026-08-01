import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

// eslint-config-next 15.5 still ships eslintrc-style configs, so they are bridged
// into flat config here. ESLint 9 dropped .eslintrc support entirely, which is why
// `npm run lint` could not start before this file existed.
const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      ".superpowers/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default config;
