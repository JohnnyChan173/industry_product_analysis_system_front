module.exports = {
  plugins: ["stylelint-order"],
  extends: [
    "stylelint-config-standard", // stylelint 标准校验规范
    "stylelint-config-prettier", // 规避 stylelint 与 prettier 冲突项
  ],
  overrides: [
    {
      files: ["**/*.{html,vue}"],
      customSyntax: "postcss-html",
    },
    {
      files: ["**/*.less"],
      customSyntax: "postcss-less",
    },
  ],
  rules: {
    "order/order": ["custom-properties", "declarations"],
    "order/properties-order": [],
    "selector-class-pattern": null, // 样式命名 无限制
    "no-descending-specificity": null,
    "no-empty-source": null,
    "selector-pseudo-element-no-unknown": null,
    "function-no-unknown": null,
    "function-url-quotes": null,
    "block-no-empty": null
  },
};
