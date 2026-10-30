import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

/** Flat ESLint config for the TanStack Start app-builder template. */
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      ".output/**",
      ".vercel/**",
      ".nitro/**",
      "node_modules/**",
      "src/routeTree.gen.ts",
      // 突變測試的暫存副本與報告。 Mutation-testing sandbox copies and reports.
      ".stryker-tmp/**",
      "reports/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      // 平台檔案 src/lib/app-data/client.server.ts 有空的 catch；不改平台檔案，改規則。
      // The platform file src/lib/app-data/client.server.ts has an empty catch; adjust the rule, not the platform file.
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  // 畫面文字一律放進 bi()（T 文案表或就地 t(bi(…))），不在畫面裡依語系分支；中英各一份才看得出缺哪一邊。
  // On-screen text goes through bi() (the T table or an inline t(bi(…))), never a branch on the locale
  // inside a view; keeping both languages side by side shows when one is missing.
  {
    files: ["src/components/views/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "ConditionalExpression > BinaryExpression.test[operator=/^[!=]==?$/]:matches([left.name='locale'], [left.property.name='locale'], [right.name='locale'], [right.property.name='locale']):matches([left.value=/^(zh|en)$/], [right.value=/^(zh|en)$/])",
          message:
            '畫面文字放進 bi()，例如 T 文案表的 bi("缺", "Missing: ")，再用 t() 取出，不要依 locale 分支。 Put on-screen text in bi(), e.g. bi("缺", "Missing: ") in the T table, and read it with t() instead of branching on locale.',
        },
      ],
    },
  },
  // Vite 載入設定檔時不認得 @/ 別名，設定檔與它們匯入的模組只能用相對路徑；eslint-config.test.mjs 確認實際匯入鏈上的每個檔案都在清單裡。
  // 動態 import() 擋不到，那時 npm run build:pages 仍會失敗。
  // Vite does not resolve the @/ alias while loading its config, so the configs and the modules they import use
  // relative paths only; eslint-config.test.mjs checks that every file on the real import chain is in this list.
  // A dynamic import() slips past this rule, but npm run build:pages still fails on it.
  {
    files: [
      "vite.config.ts",
      "vite.pages.config.ts",
      "src/document-head.ts",
      "src/brand.ts",
      "src/theme.ts",
      "src/i18n/locale.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/*"],
              message:
                "Vite 載入設定檔時不認得 @/ 別名；Vite 設定檔與它們匯入的模組請改用相對路徑，例如 src/ 裡寫 ./brand.ts。 Vite does not resolve the @/ alias while loading its config; the Vite configs and the modules they import use relative paths instead, such as ./brand.ts inside src/.",
            },
          ],
        },
      ],
    },
  },
  // Disable rules that conflict with Prettier formatting.
  prettier,
);
