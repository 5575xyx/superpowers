# absorb-v6.4-skills Implementation Plan

> 路径：`.novaway/powersnexus/changes/absorb-v6.4-skills/tasks.md`
> 关联设计：`design.md`

**Goal:** 落地上游 v6.4 技能精简、三路径 router 与诊断技能。

**Architecture:** `diagnosing-superpowers` 整目录移植并品牌本地化；writing-plans/brainstorming/test-driven-development 逐项应用增量，改动前后各跑 core 断言。

**Tech Stack:** Node.js ≥22、Bash（Git Bash）、Markdown 技能文件。

**Spec:** `design.md`、`delta-specs/skills/spec.md`

**Related Requirements:** REQ-001, REQ-002, REQ-003, REQ-004

## Review Focus

- 技能正文违反结构约束（frontmatter/词数/禁词）致加载失败 → 由 3.2 结构测试覆盖。
- 精简误删 core 断言锁定的中文/英文串 → 由 1.2/2.1 的 `npm run test:core` 覆盖。
- 删除旧参考文档后残留死链 → 由 4.1 的 grep 覆盖。

---

## Global Constraints

- 不改品牌与 L0-L4 流程；不 bump 版本。
- 保护清单文案不得删除/改写。
- 新文件不得带 UTF-8 BOM（`SKILL.md` 为文本，仍建议无 BOM）。

---

## Acceptance Criteria

| 验收标准 | 对应任务 | 验证方法 |
|----------|----------|----------|
| writing-plans 精简且保留文案 | 1.1, 1.2 | `npm run test:core` |
| brainstorming 三路径且保留文案 | 2.1 | `npm run test:core` |
| diagnosing-superpowers 20 文件且结构合规 | 3.1, 3.2 | `bash tests/diagnosing-superpowers/test-skill-structure.sh` |
| TDD 文档更替无死链 | 4.1 | `npm run test:core` + grep |

---

## Tasks

### Section 1: writing-plans 精简

- [x] 1.1.1 对照上游 v6.4.2 应用 `What a Step Contains` 替换 `No Placeholders`、`Step Granularity` 改写、新增 `Proportion` 自审。
- [x] 1.1.2 删除 `skills/writing-plans/plan-document-reviewer-prompt.md`。
- [x] 1.2.1 逐条核对保护清单文案仍在；运行 `npm run test:core`。

### Section 2: brainstorming 三路径

- [x] 2.1.1 应用 spike / bounded / architectural 分类与各自流程。
- [x] 2.1.2 核对保护清单中文串仍在；运行 `npm run test:core`。

### Section 3: diagnosing-superpowers

- [x] 3.1.1 整目录移植（20 文件），品牌本地化（去 `superpowers`、`~/.superpowers`）。
- [x] 3.1.2 保留合法 frontmatter；确认正文 ≤1000 词、含 `## Hard rules`/`## Red Flags`、无禁词。
- [x] 3.2.1 新增 `tests/diagnosing-superpowers/test-skill-structure.sh`（本地化）并登记进 platform。
- [x] 3.2.2 运行结构测试通过。

### Section 4: TDD 文档更替

- [x] 4.1.1 删除 `skills/test-driven-development/testing-anti-patterns.md`。
- [x] 4.1.2 同步 `writing-good-tests.md` 为上游版；修正 `SKILL.md` 死链。
- [x] 4.1.3 `npm run test:core` 全绿（含 `upstream-absorption`、`bootstrap-caching`）。

### Section 5: 验证

- [x] 5.1.1 `npm test` 与 `npm run test:platform` 通过。
- [x] 5.1.2 生成 `delivery.json` 并 `powersnexus verify delivery absorb-v6.4-skills`。

---

## Progress Ledger

| 任务 | 状态 | 完成时间 | 审查意见 |
|------|------|----------|----------|
| 1.1 | 🔄 | | |
| 1.2 | 🔄 | | |
| 2.1 | 🔄 | | |
| 3.1 | 🔄 | | |
| 3.2 | 🔄 | | |
| 4.1 | 🔄 | | |
| 5.1 | 🔄 | | |

---

**文档版本：** v1.0
**创建日期：** 2026-09-30
