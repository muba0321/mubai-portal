module.exports = {
  root: true,
  extends: [
    "stylelint-config-standard-scss",
    "stylelint-config-standard-vue/scss",
    "stylelint-config-recess-order",
  ],
  rules: {
    "selector-class-pattern": null,
    "no-descending-specificity": null,
  },
};
