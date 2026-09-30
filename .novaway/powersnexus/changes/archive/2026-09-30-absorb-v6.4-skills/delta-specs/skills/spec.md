# Delta Spec: skills 模块

> 路径：`.novaway/powersnexus/changes/absorb-v6.4-skills/delta-specs/skills/spec.md`
> 变更模式：Greenfield（ADDED）— 归档时创建 `specs/skills/spec.md`

---

## ADDED Requirements

### REQ-001: writing-plans 精简为"计划只记录决策"

**状态:** 已提议

**陈述：** `writing-plans` 须以 `What a Step Contains`（测试步骤给测试名与断言；代码步骤给精确签名/文件/spec 值；仅算法未被确定时给函数体）取代 `No Placeholders`，并新增 `Proportion` 自审（计划长度与 spec 比较）；`Step Granularity` 描述为"一个带可检验结果的动作"；删除 `plan-document-reviewer-prompt.md`。

**验收：**

- `writing-plans/SKILL.md` 含 `What a Step Contains` 与 `Proportion` 自审；不含 `## No Placeholders`。
- `skills/writing-plans/plan-document-reviewer-prompt.md` 已删除。
- 保留文案：`**Spec:**`、`## Review Focus`、`approved visual contract`、`Please review the plan`、`Subagent-driven`、`Native`、`powersnexus verify delivery <change-name>`。
- `tests/upstream-absorption.test.mjs` 与 `tests/frontend-quality-skill.test.mjs` 通过。

### REQ-002: brainstorming 三路径 router

**状态:** 已提议

**陈述：** `brainstorming` 须把请求分为 spike / bounded / architectural 三类，仪式随规模伸缩，小任务跳过双文档仪式；每条路径仍在实现前等待用户批准。保留既有 `bounded` 防误判定义与 `question` 工具流程。

**验收：**

- 含 spike / bounded / architectural 分类及各自流程说明。
- 保留文案：`L0 的机械性改动不调用本技能`、`## Checklist（仅 L2+）`、`L1 已按“渐进执行规则”...`、`## Process Flow（L2+）`、`powersnexus init delivery <change-name> --profile`、`ui-ux-pro-max`、`frontend-quality`。
- `tests/progressive-activation.test.mjs` 与 `tests/frontend-quality-skill.test.mjs` 通过。

### REQ-003: 新增 diagnosing-superpowers 技能

**状态:** 已提议

**陈述：** 新增 `skills/diagnosing-superpowers/`，含 `SKILL.md`、`prompts/`（11）、`references/`（4）、`templates/`（4，含 `bundle-README.md`）。技能用于排查会话问题并给出 `path:line` 证据，可生成脱敏 bundle 或草拟 issue 并经用户批准。

**验收：**

- 目录含全部 20 个文件。
- `SKILL.md` 有合法 frontmatter（`name`/`description`，`description` 以 `Use when` 开头、≤1024 字符），正文 ≤1000 词，含 `## Hard rules` 与 `## Red Flags`，不含 `dispatch`/`then`/`step`/`the user`/绝对路径。
- 品牌本地化：正文无 `superpowers`、`~/.superpowers/...` 残留。
- `tests/diagnosing-superpowers/test-skill-structure.sh` 通过并登记进 platform 套件。
- `tests/opencode/bootstrap-caching.test.mjs` 通过（新技能 frontmatter 合法）。

### REQ-004: TDD 参考文档更替

**状态:** 已提议

**陈述：** 删除 `skills/test-driven-development/testing-anti-patterns.md`，`writing-good-tests.md` 同步为上游版，并修正 `SKILL.md` 中指向旧文档的链接。

**验收：**

- `testing-anti-patterns.md` 已删除且无引用残留。
- `tests/upstream-absorption.test.mjs` 对 `writing-good-tests.md`（`Name the Break` / `Mutation Check`）断言通过。

---

**文档版本：** v1.0
