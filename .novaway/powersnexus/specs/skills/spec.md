# Master Specification: skills

> 路径：.novaway/powersnexus/specs/skills/spec.md
> 用途：项目主规格（单一事实来源）
> 版本：v1.1
> 状态：Active
> 创建模式：Greenfield（首次创建）
> 来源变更：absorb-v6.4-behavior-fixes

---

## Metadata

| 字段 | 内容 |
|------|------|
| **模块名称** | skills |
| **规格版本** | v1.1 |
| **创建日期** | 2026-09-30 |
| **最后更新** | 2026-09-30 |
| **负责团队** | AI Agent + Human Partner |
| **变更历史** | 见 §6 |

---

## 1. 模块概述

本规格由变更 `absorb-v6.4-behavior-fixes` 的 Delta Spec 自动创建，覆盖模块 `skills` 在本次变更中新增的需求。

本次识别的需求：REQ-002, REQ-003。

---

## 2. 功能规格

### 2.2 详细需求



#

---

#### REQ-001: writing-plans 精简为"计划只记录决策"

**状态:** 已提议

**陈述：** `writing-plans` 须以 `What a Step Contains`（测试步骤给测试名与断言；代码步骤给精确签名/文件/spec 值；仅算法未被确定时给函数体）取代 `No Placeholders`，并新增 `Proportion` 自审（计划长度与 spec 比较）；`Step Granularity` 描述为"一个带可检验结果的动作"；删除 `plan-document-reviewer-prompt.md`。

**验收：**

- `writing-plans/SKILL.md` 含 `What a Step Contains` 与 `Proportion` 自审；不含 `## No Placeholders`。
- `skills/writing-plans/plan-document-reviewer-prompt.md` 已删除。
- 保留文案：`**Spec:**`、`## Review Focus`、`approved visual contract`、`Please review the plan`、`Subagent-driven`、`Native`、`powersnexus verify delivery <change-name>`。
- `tests/upstream-absorption.test.mjs` 与 `tests/frontend-quality-skill.test.mjs` 通过。

---

#### REQ-002: brainstorming 三路径 router

**状态:** 已提议

**陈述：** `brainstorming` 须把请求分为 spike / bounded / architectural 三类，仪式随规模伸缩，小任务跳过双文档仪式；每条路径仍在实现前等待用户批准。保留既有 `bounded` 防误判定义与 `question` 工具流程。

**验收：**

- 含 spike / bounded / architectural 分类及各自流程说明。
- 保留文案：`L0 的机械性改动不调用本技能`、`## Checklist（仅 L2+）`、`L1 已按“渐进执行规则”...`、`## Process Flow（L2+）`、`powersnexus init delivery <change-name> --profile`、`ui-ux-pro-max`、`frontend-quality`。
- `tests/progressive-activation.test.mjs` 与 `tests/frontend-quality-skill.test.mjs` 通过。

---

#### REQ-003: 新增 diagnosing-superpowers 技能

**状态:** 已提议

**陈述：** 新增 `skills/diagnosing-superpowers/`，含 `SKILL.md`、`prompts/`（11）、`references/`（4）、`templates/`（4，含 `bundle-README.md`）。技能用于排查会话问题并给出 `path:line` 证据，可生成脱敏 bundle 或草拟 issue 并经用户批准。

**验收：**

- 目录含全部 20 个文件。
- `SKILL.md` 有合法 frontmatter（`name`/`description`，`description` 以 `Use when` 开头、≤1024 字符），正文 ≤1000 词，含 `## Hard rules` 与 `## Red Flags`，不含 `dispatch`/`then`/`step`/`the user`/绝对路径。
- 品牌本地化：正文无 `superpowers`、`~/.superpowers/...` 残留。
- `tests/diagnosing-superpowers/test-skill-structure.sh` 通过并登记进 platform 套件。
- `tests/opencode/bootstrap-caching.test.mjs` 通过（新技能 frontmatter 合法）。

---

#### REQ-004: TDD 参考文档更替

**状态:** 已提议

**陈述：** 删除 `skills/test-driven-development/testing-anti-patterns.md`，`writing-good-tests.md` 同步为上游版，并修正 `SKILL.md` 中指向旧文档的链接。

**验收：**

- `testing-anti-patterns.md` 已删除且无引用残留。
- `tests/upstream-absorption.test.mjs` 对 `writing-good-tests.md`（`Name the Break` / `Mutation Check`）断言通过。

---

**文档版本：** v1.1
---

## 3. 非功能性需求

本次 Delta Spec 未显式定义额外的非功能性需求；后续变更如有性能、可用性或运行环境约束，应以新的 Delta Spec 更新本主规格。

---

## 4. 架构设计

架构决策以变更目录 `.novaway/powersnexus/changes/absorb-v6.4-behavior-fixes/design.md` 为准。归档过程保留该来源引用，不复制或推测未在 Delta Spec 中声明的设计细节。

---

## 5. 数据模型

本次 Delta Spec 未声明独立的数据模型变更。

---

## 6. 变更历史

| 版本 | 日期 | 变更类型 | 变更说明 | 关联变更 |
|------|------|----------|----------|----------|
| v1.0 | 2026-09-30 | INITIAL | 首次创建 | skills |

| v1.1 | 2026-09-30 | ADDED | ADDED REQ-001；ADDED REQ-002；ADDED REQ-003；ADDED REQ-004 | absorb-v6.4-skills |
---

## 7. 术语表

| 术语 | 定义 |
|------|------|
| Delta Spec | 记录本次变更新增或调整需求的规格文件 |

---

**文档版本：** v1.0
**创建日期：** 2026-09-30
**最后更新：** 2026-09-30
