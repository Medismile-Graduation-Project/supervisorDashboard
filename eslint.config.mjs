import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig({
  extends: "next/core-web-vitals", // استخدم extends مباشرة بدل الاستيراد
  ignorePatterns: [
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ],
});

export default eslintConfig;
