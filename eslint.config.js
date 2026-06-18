import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import i18next from 'eslint-plugin-i18next'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'src/routeTree.gen.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
      prettier,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // TanStack file routes export `Route` alongside the component.
      'react-refresh/only-export-components': ['warn', { allowExportNames: ['Route'] }],
      // autoFocus is used only on the first field of modal dialogs / search,
      // where moving focus to the obvious entry point aids rather than harms.
      'jsx-a11y/no-autofocus': 'off',
      // Toggle rows wrap a Radix <Switch> in a <label>; teach the rule that
      // Switch is the associated control so the nesting is recognised.
      'jsx-a11y/label-has-associated-control': ['error', { controlComponents: ['Switch'] }],
      // Media tools preview user-transcoded audio/video that has no caption track
      // — the rule doesn't apply to dynamically produced output.
      'jsx-a11y/media-has-caption': 'off',
    },
  },
  {
    files: ['src/routes/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // i18n guard: no new hardcoded user-facing strings in tools or app chrome.
  // Tests are exempt — they assert on rendered English.
  {
    files: ['src/tools/**/*.{ts,tsx}', 'src/components/layout/**/*.tsx', 'src/routes/**/*.tsx'],
    ignores: ['src/**/*.test.{ts,tsx}'],
    plugins: { i18next },
    rules: {
      'i18next/no-literal-string': 'error',
    },
  },
])
