# Process Declaration: {{CHANGE_NAME}}

> 模板来源：PowersNexus OpenSpec
> 路径：`.novaway/powersnexus/changes/<name>/process-declaration.md`
> 用途：归档前流程审计（`powersnexus audit <change-name>`）的合规声明，证明流程真实执行而非仅有工件。

## 声明级别

声明级别: {{PROCESS_LEVEL}}
> 填 L0-L4。应不低于按真实信号推断的最低级别（实现文件数、总行数、模块数、任务数、需求数）。

## 遵循步骤

{{FOLLOWED_STEPS}}
> 列出本次实际执行的流程步骤，例如：设计契约 → 计划 → 实现 → 测试 → 审查。每一步应能对应到工件或验证记录。

## 跳过步骤及理由

{{SKIPPED_STEPS_AND_REASONS}}
> 列出被跳过的流程步骤并说明理由；若无跳过填"无"。审计要求此字段存在，空跳过的声明会被拒收。

## 审查记录

{{REVIEW_RECORD}}
> L2+ 必填。填写审查方式（自审/代码专家审查/红队审查）、审查时间与结论；或注明审查文件（如 `code-red-team-review.md`、`red-team-review.md`）。L3+ 要求存在 `red-team-review.md`。document 交付记录用户确认结论。