module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // 新功能
        "fix", // 修补BUG
        "docs", // 更新文档
        "style", // 修改样式
        "refactor", // 重构（对宏观项目）
        "chore", // 构建过程或辅助工具的变动
        "merge", // 合并分支
        "perf", // 优化性能提升
        "revert", // 回滚到上一个版本
        "build", // 构建
      ],
    ],
    "type-case": [0],
    "type-empty": [0],
    "scope-empty": [0],
    "scope-case": [0],
    "subject-full-stop": [0, "never"],
    "subject-case": [0, "never"],
    "header-max-length": [0, "always", 72],
  },
};
