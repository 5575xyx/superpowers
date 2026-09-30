# 文档交叉引用映射

> 路径：`.novaway/powersnexus/changes/absorb-v6.4-behavior-fixes/cross-reference.md`
> 用途：追踪本变更所有文档之间的关联关系

---

## 文档总览

| 文档 | 路径 | 版本 | 状态 |
|------|------|------|------|
| Proposal | `proposal.md` | v1.0 | Approved |
| Delta Specs | `delta-specs/hooks/spec.md`、`delta-specs/skills/spec.md` | v1.0 | Approved |
| Design | `design.md` | v1.0 | Approved |
| Tasks | `tasks.md` | v1.0 | Pending |
| 流程声明 | `process-declaration.md` | v1.0 | Draft |

---

## 模块状态

| 模块 | 状态 | 变更模式 |
|------|------|----------|
| hooks | 存在（主规格 `specs/hooks/spec.md`） | Brownfield |
| skills | 不存在主规格（首次） | Greenfield |

---

## 需求 ↔ 任务映射

| 需求 | 对应任务 |
|------|----------|
| REQ-001 hooks `shell:"bash"` + 断言 | 1.1, 1.2 |
| REQ-002 finishing worktree 两处修复 | 2.1 |
| REQ-003 find-polluter 修复 + 测试 | 3.1, 3.2 |

---

## 任务 ↔ 文件映射

| 任务 | 文件 |
|------|------|
| 1.1 | `hooks/hooks.json` |
| 1.2 | `tests/hooks/test-session-start.sh` |
| 2.1 | `skills/finishing-a-development-branch/SKILL.md` |
| 3.1 | `skills/systematic-debugging/find-polluter.sh` |
| 3.2 | `tests/systematic-debugging/test-find-polluter.sh`、`tests/run-platform-tests.sh` |

---

## 验收条件 ↔ 验证映射

| 验收条件 | 验证方式 |
|----------|----------|
| hooks `shell:"bash"` 声明 | `bash tests/hooks/test-session-start.sh` |
| finishing 两处修复 | 人工复核 diff + `test-worktree-path-policy.sh` |
| find-polluter 修复 | `bash tests/systematic-debugging/test-find-polluter.sh` |
| core 无回归 | `npm run test:core` |

---

**文档版本：** v1.0
**创建日期：** 2026-09-30
