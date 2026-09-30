# 文档交叉引用映射

> 路径：`.novaway/powersnexus/changes/absorb-v6.4-skills/cross-reference.md`

---

## 文档总览

| 文档 | 路径 | 版本 | 状态 |
|------|------|------|------|
| Proposal | `proposal.md` | v1.0 | Approved |
| Delta Specs | `delta-specs/skills/spec.md` | v1.0 | Approved |
| Design | `design.md` | v1.0 | Approved |
| Tasks | `tasks.md` | v1.0 | Pending |
| 流程声明 | `process-declaration.md` | v1.0 | Draft |

---

## 模块状态

| 模块 | 状态 | 变更模式 |
|------|------|----------|
| skills | 不存在主规格（首次） | Greenfield |

---

## 需求 ↔ 任务映射

| 需求 | 对应任务 |
|------|----------|
| REQ-001 writing-plans 精简 | 1.1, 1.2 |
| REQ-002 brainstorming 三路径 | 2.1 |
| REQ-003 diagnosing-superpowers | 3.1, 3.2 |
| REQ-004 TDD 文档更替 | 4.1 |

---

## 任务 ↔ 文件映射

| 任务 | 文件 |
|------|------|
| 1.1 | `skills/writing-plans/SKILL.md`、删除 `skills/writing-plans/plan-document-reviewer-prompt.md` |
| 1.2 | `npm run test:core` |
| 2.1 | `skills/brainstorming/SKILL.md` |
| 3.1 | `skills/diagnosing-superpowers/**` |
| 3.2 | `tests/diagnosing-superpowers/test-skill-structure.sh`、`tests/run-platform-tests.sh` |
| 4.1 | 删除 `skills/test-driven-development/testing-anti-patterns.md`、`skills/test-driven-development/writing-good-tests.md`、`skills/test-driven-development/SKILL.md` |

---

## 验收条件 ↔ 验证映射

| 验收条件 | 验证方式 |
|----------|----------|
| writing-plans 精简且保留文案 | `tests/upstream-absorption.test.mjs`、`tests/frontend-quality-skill.test.mjs` |
| brainstorming 三路径且保留文案 | `tests/progressive-activation.test.mjs`、`tests/frontend-quality-skill.test.mjs` |
| diagnosing 结构合规 | `tests/diagnosing-superpowers/test-skill-structure.sh`、`tests/opencode/bootstrap-caching.test.mjs` |
| TDD 文档更替无死链 | `tests/upstream-absorption.test.mjs` + grep |

---

**文档版本：** v1.0
**创建日期：** 2026-09-30
