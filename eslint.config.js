import js from '@eslint/js';
import globals from 'globals';
import stylistic from '@stylistic/eslint-plugin';

export default [
  // These two are generated from .env, so they are build output rather than source.
  { ignores: ['**/node_modules/**', 'core/constants/affiliate.js', 'browser-extension/operators.js'] },

  js.configs.recommended,
  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: true,
    jsx: false,
    arrowParens: true,
    braceStyle: '1tbs',
    commaDangle: 'always-multiline',
  }),

  // The POC copy lives in long strings, so line length is not a useful signal here.
  { rules: { '@stylistic/max-len': 'off', '@stylistic/max-statements-per-line': 'off' } },

  {
    files: [
      'core/**/*.js',
      'cookie-proof/**/*.js',
      'hidden-iframe/**/*.js',
      'pop-under/**/*.js',
      'pop-over/**/*.js',
      'server-side-click/**/*.js',
      'banner-impression/**/*.js',
      'ip-spoof-relay/ip-spoof-relay.js',
      'navigation-flows/controls.js',
      'navigation-flows/navigation-flows.js',
      'opener-isolation/**/*.js',
      'user-gesture/**/*.js',
      'pre-navigation-beacon/**/*.js',
      'samesite-cookies/**/*.js',
    ],
    languageOptions: { globals: globals.browser },
  },
  { files: ['server.js', 'ip-spoof-relay/set-attribution.js', 'scripts/**/*.js'], languageOptions: { globals: globals.node } },
  { files: ['navigation-flows/*.test.js'], languageOptions: { globals: globals.node } },
  { files: ['browser-extension/**/*.js'], languageOptions: { globals: { ...globals.browser, ...globals.serviceworker, ...globals.webextensions } } },
];
