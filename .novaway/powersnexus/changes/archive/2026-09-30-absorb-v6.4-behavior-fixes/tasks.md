# absorb-v6.4-behavior-fixes Implementation Plan

> 路径：`.novaway/powersnexus/changes/absorb-v6.4-behavior-fixes/tasks.md`
> 关联设计：`design.md`

**Goal:** 落地上游 v6.2/v6.3 的三项行为修复及其测试。

**Architecture:** 机械文件从 `obra/main` 直接移植并本地化；finishing/find-polluter 逐项应用增量，保留本地品牌与措辞。

**Tech Stack:** Node.js ≥22、Bash（Git Bash）、本仓库 shell 测试框架。

**Spec:** `design.md`、`delta-specs/hooks/spec.md`、`delta-specs/skills/spec.md`

**Related Requirements:** REQ-001（hooks）、REQ-002（finishing）、REQ-003（find-polluter）

## Review Focus

- Windows 路径含元字符（`(`、空格）时 hooks 命令是否仍正确执行 → 由 1.2 的 hooks.json 断言 + 上游 Windows 验证覆盖。
- `git worktree remove` 被拒且工作树含未跟踪计划/笔记时，技能是否停止询问而非强删 → 由 2.1 的人工复核覆盖。
- `find-polluter.sh` 传入 `./` 前缀模式或顶层测试文件时是否误判 → 由 3.2 的测试覆盖。

---

## Global Constraints

- 不 bump 版本；不改品牌与 L0-L4 流程。
- 所有脚本不得带 UTF-8 BOM。
- REQ 编号与 delta 章节标题遵循 CLI 契约。

---

## Acceptance Criteria

| 验收标准 | 对应任务 | 验证方法 |
|----------|----------|----------|
| hooks.json 含 `shell:"bash"` 且有断言 | 1.1, 1.2 | `bash tests/hooks/test-session-start.sh` |
| finishing 两处修复 | 2.1 | 人工复核 + `test-worktree-path-policy.sh`（若可跑） |
| find-polluter 修复且测试通过 | 3.1, 3.2 | `bash tests/systematic-debugging/test-find-polluter.sh` |
| core 无回归 | 4.1 | `npm run test:core` |

---

## Tasks

### Section 1: hooks SessionStart

#### Task 1.1: hooks.json 加 shell: bash

- [x] 1.1.1 在 `hooks/hooks.json` 的 SessionStart 命令对象加入 `"shell": "bash"`。
- [x] 1.1.2 核对 JSON 合法且无 BOM：`node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf8'))"`。

#### Task 1.2: test-session-start.sh 增加断言

- [x] 1.2.1 从上游 `tests/hooks/test-session-start.sh` 取 hooks.json 断言段，本地化路径/品牌。
- [x] 1.2.2 运行 `bash tests/hooks/test-session-start.sh`，全部通过。

### Section 2: finishing worktree 修复

#### Task 2.1: 应用两处修复

- [x] 2.1.1 在检测环境阶段捕获 `WORKTREE_PATH`，清理阶段复用。
- [x] 2.1.2 增加 removal-refused 分支：`git status --porcelain -uall` 列文件 + 三选项询问，禁 `--force`。
- [x] 2.1.3 保留 `.worktrees/` 归属措辞；人工复核 diff 未删本地段落。

### Section 3: find-polluter 修复与测试

#### Task 3.1: 修复 find-polluter.sh

- [x] 3.1.1 移植上游 `find-polluter.sh` 修复（`./` 前缀、`**/` 折叠、空输入）。
- [x] 3.1.2 `bash -n skills/systematic-debugging/find-polluter.sh` 语法通过。

#### Task 3.2: 新增并登记测试

- [x] 3.2.1 新增 `tests/systematic-debugging/test-find-polluter.sh`（移植上游并本地化）。
- [x] 3.2.2 在 `tests/run-platform-tests.sh` 登记该测试。
- [x] 3.2.3 运行该测试，全部通过。

### Section 4: 验证

#### Task 4.1: 全量验证

- [x] 4.1.1 `npm run test:core` 无回归。
- [x] 4.1.2 `bash tests/run-platform-tests.sh`（或在 Git Bash）通过。
- [x] 4.1.3 生成 `delivery.json`（library）并 `powersnexus verify delivery absorb-v6.4-behavior-fixes`。

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

---

**文档版本：** v1.0
**创建日期：** 2026-09-30
