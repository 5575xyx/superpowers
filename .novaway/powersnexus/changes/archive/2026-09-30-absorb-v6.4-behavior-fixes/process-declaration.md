# Process Declaration: absorb-v6.4-behavior-fixes

> 路径：`.novaway/powersnexus/changes/absorb-v6.4-behavior-fixes/process-declaration.md`
> 用途：归档前流程审计（`powersnexus audit`）的合规声明

## 声明级别

声明级别: L3
> 依据：涉及 hooks 与 skills 两类模块的行为修复，流程审计按实现文件与改动量推断最低 L3。经红队建议拆分为三个独立变更中的第一个（行为修复，风险最高、可独立回滚）。

## 遵循步骤

1. task-size-assessor 评估任务规模（已加载）。
2. brainstorming 进入设计（已加载），确认拆分与移植边界。
3. 红队设计审查（三个并行子代理：上游清单核验、本地测试约束、架构/测试/归档风险）。
4. 创建变更结构（proposal/design/tasks/cross-reference/traceability/delta-specs）。
5. 逐项落实三项修复，机械文件直接移植、行为技能应用增量。
6. 运行 `npm run test:core` 与 platform 套件验证。
7. `powersnexus check delivery` → `powersnexus audit` → `powersnexus archive`。

## 跳过步骤及理由

基线压力测试（RED）被跳过：三项修复均直接采用上游以实证测试覆盖的结论（上游自带 `test-find-polluter.sh`、hooks 断言），不涉及新规则发明；如发现行为退化即回滚对应文件。

## 审查记录

- 红队（2026-09-30）：三个子代理核验，识别出 REQ 编号/章节标题 CLI 兼容、测试分层、`using-powersnexus` 路径映射、`.version-bump.json` 驱动、skills 创建模式等 Critical/Important 问题，已并入本变更设计。
- 自审：逐文件核对改动与上游实证结论一致；选项计数与措辞一致性人工复核。

## 用户确认

用户于 2026-09-30 确认：采用 L3 流程、拆分为三个变更、范围内全移植并附排除表。用户确认结论：方案通过。
