# Process Declaration: absorb-v6.4-skills

> 路径：`.novaway/powersnexus/changes/absorb-v6.4-skills/process-declaration.md`

## 声明级别

声明级别: L4
> 依据：新增技能 + 两个既有行为技能改写 + 参考文档更替，涉及技能行为契约与多个 core 断言；流程审计按改动量推断最低 L4。经红队建议拆分为三个独立变更中的第二个（技能，library 交付）。

## 遵循步骤

1. task-size-assessor 评估（已加载）。
2. brainstorming 设计并确认拆分与移植边界（已加载）。
3. 红队设计审查（三个并行子代理）。
4. writing-skills 验证技能改动（技能开发工作流）。
5. 创建变更结构并逐项落地 REQ-001..004。
6. `npm run test:core` 与 platform 套件验证；生成 delivery 证据。
7. `check delivery` → `audit` → `archive`。

## 跳过步骤及理由

- 基线压力测试（RED）部分跳过：writing-plans/brainstorming 的改动采用上游以 subagent probe 覆盖的结论；diagnosing-superpowers 直接移植上游并以其结构测试为准。
- 完整红队代码审查未执行：本变更为技能文本/新增文档，以既有 core 断言 + 结构测试作为行为门禁；如断言退化即回滚。

## 审查记录

- 红队（2026-09-30）：识别出 writing-plans/brainstorming 断言保护清单、diagnosing 结构约束、模板数量（4）、`using-powersnexus` 路径等问题，已并入设计保护清单。
- 自审：逐条比对保护清单；确认新技能 frontmatter 合法。

## 用户确认

用户于 2026-09-30 确认：L3 流程、拆分为三个变更、范围内全移植并附排除表。用户确认结论：方案通过。
