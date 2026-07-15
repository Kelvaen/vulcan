// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // Advisory only: our screens load data on mount and setState after the
      // fetch resolves (post-await, not a synchronous render cascade). Keep it
      // visible as a warning rather than a hard error.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);
