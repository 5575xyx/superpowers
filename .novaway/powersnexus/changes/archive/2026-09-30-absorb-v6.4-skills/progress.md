# PowersNexus ledger — plan: .novaway/powersnexus/changes/absorb-v6.4-skills/tasks.md

> 执行者：Native（executing-plans）｜开始：2026-09-30

## Pre-flight

任务共享接口：

- `skills/writing-plans/SKILL.md`、`skills/brainstorming/SKILL.md`、`skills/diagnosing-superpowers/**`、`skills/test-driven-development/*` — 各属独立任务；`tests/run-tests.mjs` 的断言（progressive-activation/upstream-absorption/frontend-quality）被 REQ-001/002/004 共享，属既有断言回归门禁。

`Pre-flight: no cross-task shared interfaces`（共享仅限 core 回归门禁）。

## Rulings

- REQ-004: Ruling: 品牌替换在 PowerShell `-replace`（大小写不敏感）下使 `~/.superpowers` 变为 `~/.PowersNexus`、`obra/superpowers` 变为 `obra/PowersNexus`；已二次修正为 `~/.powersnexus` 与 `nova-way/powersnexus`。成本：一次额外替换，已复核 clean。
- 技能名 `diagnosing-superpowers` 保留不替换（目录/frontmatter 为技能标识）。

## Log

- REQ-001: complete — writing-plans 应用 `What a Step Contains`+`Step Granularity`+`Proportion`+Overview 改写；删 `plan-document-reviewer-prompt.md`；保留本地 Consistency Check/Execution Handoff/NFR/`approved visual contract` 等断言文案；core 106/106。
- REQ-002: complete — brainstorming 新增三路径分级（spike/bounded/architectural）衔接 L0-L4；保留 Checklist/Process Flow 等中文断言；core 106/106。
- REQ-003: complete — 移植 diagnosing-superpowers 20 文件并品牌本地化；`test-skill-structure.sh` 46/0 通过并登记 platform；core 106/106。
- REQ-004: complete — 删除 testing-anti-patterns.md，writing-good-tests.md 同步上游（151 行）并本地化，修正 SKILL.md 链接；core 106/106。
- 变更 B 交付完成：`npm run test:platform` 全通过；`verify delivery` 通过（100%），`delivery-report.md` 已生成。
