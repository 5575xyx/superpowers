# Design: absorb-v6.4-skills

> 路径：`.novaway/powersnexus/changes/absorb-v6.4-skills/design.md`
> 关联提议：`proposal.md`
> 关联规格：`delta-specs/skills/spec.md`

---

## 1. Technical Approach

`diagnosing-superpowers` 整目录从 `obra/main` 移植并品牌本地化；`writing-plans`/`brainstorming`/`test-driven-development` 逐项应用上游增量。改动前先跑 core 断言，改后逐条比对关键文案。

---

## 2. Architecture Decisions

### ADR-1: REQ 编号与 delta 章节标题遵循 CLI 契约

**状态：** Accepted
**决策：** 用 `REQ-00X` 与英文 `## ADDED Requirements`；本模块 Greenfield，delta 仅 ADDED。

### ADR-2: 技能正文沿用现有语言惯例

**状态：** Accepted
**决策：** 新增/机械文件照搬上游英文；既有中文技能只追加必要中文。**不**因"统一中文"改写既有措辞。

### ADR-3: 保护清单优先于精简

**状态：** Accepted
**背景：** `progressive-activation`、`upstream-absorption`、`frontend-quality-skill`、`bootstrap-caching` 等 core 断言锁定关键中文/英文串与新技能 frontmatter。
**决策：** 精简只删除冗余，不动保护清单中的文案；新增技能必须满足结构测试约束。

### ADR-4: 交付 profile = library

**状态：** Accepted
**决策：** `delivery.json` 用 `library`，argv：core 测试 + diagnosing 结构测试（platform）。

---

## 3. File Changes

### 3.1 New Files

| 路径 | 说明 |
|------|------|
| `skills/diagnosing-superpowers/SKILL.md` | 诊断技能主文件 |
| `skills/diagnosing-superpowers/prompts/*.md` | 11 个分析提示 |
| `skills/diagnosing-superpowers/references/*.md` | 4 个参考（context-safety/github-issues/redaction-policy/session-discovery） |
| `skills/diagnosing-superpowers/templates/*.md` | 4 个模板（bundle-README/case/issue/report） |
| `tests/diagnosing-superpowers/test-skill-structure.sh` | 技能结构测试 |

### 3.2 Modified Files

| 路径 | 变更 |
|------|------|
| `skills/writing-plans/SKILL.md` | `What a Step Contains` + `Proportion` |
| `skills/brainstorming/SKILL.md` | 三路径 router |
| `skills/test-driven-development/SKILL.md` | 修正指向旧文档的链接 |
| `skills/test-driven-development/writing-good-tests.md` | 同步上游版 |
| `tests/run-platform-tests.sh` | 登记 diagnosing 结构测试 |

### 3.3 Deleted Files

| 路径 | 原因 |
|------|------|
| `skills/writing-plans/plan-document-reviewer-prompt.md` | 上游 v6.4.2 删除（无人引用） |
| `skills/test-driven-development/testing-anti-patterns.md` | 已由 `writing-good-tests.md` 取代 |

### 3.4 保护清单（不得删除/改写）

- brainstorming：`L0 的机械性改动不调用本技能`、`## Checklist（仅 L2+）`、`L1 已按“渐进执行规则”...`、`## Process Flow（L2+）`、`powersnexus init delivery <change-name> --profile`、`ui-ux-pro-max`、`frontend-quality`
- writing-plans：`**Spec:**`、`## Review Focus`、`powersnexus verify delivery <change-name>`、`approved visual contract`、`Please review the plan`、`Subagent-driven`、`Native`

---

## 4. 需求映射

| 需求 | 实现文件 | 验证 |
|------|----------|------|
| REQ-001 | `skills/writing-plans/SKILL.md` | `tests/upstream-absorption.test.mjs` |
| REQ-002 | `skills/brainstorming/SKILL.md` | `tests/progressive-activation.test.mjs` |
| REQ-003 | `skills/diagnosing-superpowers/SKILL.md` | `tests/diagnosing-superpowers/test-skill-structure.sh` |
| REQ-004 | `skills/test-driven-development/writing-good-tests.md` | `tests/upstream-absorption.test.mjs` |

---

## 5. 归档工件

| 工件 | 要求 |
|------|------|
| `tasks.md` | checklist 覆盖 REQ-001..004 |
| `cross-reference.md` | REQ ↔ 任务 ↔ 文件 |
| `traceability.md` | 每 REQ 实现 + 测试，路径真实存在 |
| `process-declaration.md` | 级别/步骤/跳过/审查/用户确认 |
| `delivery.json` | `library` + 真实 argv |

---

## 6. Risk Assessment

| 风险 | 可能性 | 影响 | 缓解 | 预警 |
|------|--------|------|------|------|
| 精简 writing-plans 删掉断言所需文案 | 高 | 高 | 对照保护清单逐条保留；改前后各跑 core | `upstream-absorption`/`frontend-quality` 失败 |
| brainstorming router 改写删中文断言串 | 高 | 高 | 同上 | `progressive-activation` 失败 |
| diagnosing SKILL.md 违反结构约束（词数/禁词/frontmatter） | 中 | 高 | 照搬上游（上游已满足），仅改品牌 | 结构测试失败 |
| 删除 testing-anti-patterns 后残留链接 | 中 | 中 | grep 全仓引用并修正 | 出现死链 |
| 新技能 frontmatter 非法致 bootstrap-caching 失败 | 低 | 高 | 保留上游合法 frontmatter | `bootstrap-caching.test.mjs` 失败 |
| 品牌残留（superpowers/绝对路径） | 中 | 中 | grep `superpowers`、`/Users/`、`~/.superpowers` | 结构测试/人工复核 |

---

## 7. Testing Strategy

| 内容 | 命令 | 层级 |
|------|------|------|
| core 全绿 | `npm run test:core` | core |
| 诊断技能结构 | `bash tests/diagnosing-superpowers/test-skill-structure.sh` | platform |
| 全量 | `npm test` + `npm run test:platform` | — |

---

**文档版本：** v1.0
**创建日期：** 2026-09-30
