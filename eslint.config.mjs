import { fixupConfigRules } from "@eslint/compat";
import reactRefresh from "eslint-plugin-react-refresh";
import reactCompiler from "eslint-plugin-react-compiler";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/dist", "**/.eslintrc.cjs"],
}, ...fixupConfigRules(compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
)), {
    plugins: {
        "react-refresh": reactRefresh,
        "react-compiler": reactCompiler,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
        },

        parser: tsParser,
    },

    rules: {
        "react-refresh/only-export-components": ["warn", {
            allowConstantExport: true,
        }],

        // Note: you must disable the base rule as it can report incorrect errors
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": "warn",
        "prefer-const": "warn",
        "no-debugger": "off",
        "react-compiler/react-compiler": "warn",
    },
}];