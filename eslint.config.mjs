import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals"; // For specifying global variables like 'test' from ava

const compat = new FlatCompat();

export default [
    // Configuration for .js files (e.g., index.js) using eslint-config-postcss
    {
        files: ["**/*.js"],
        ...compat.extends("eslint-config-postcss").reduce((acc, config) => ({...acc, ...config}), {}) // compat.extends returns an array
    },
    // Configuration for .mjs files (e.g., test.mjs)
    {
        files: ["**/*.mjs"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.node, // or globals.browser if appropriate, ava tests run in node
                test: "readonly" // ava's test function
            }
        },
        // Add any specific rules for .mjs files here if needed
        // If no specific rules, ESLint's recommended rules might apply by default if not overridden
    }
];
