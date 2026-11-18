import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  { rules: { "@typescript-eslint/no-unused-vars": "error", "no-control-regex": "error" } },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".github/threatcrush/**"]),
]);
