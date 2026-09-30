# Design: absorb-v6.4-behavior-fixes

> 路径：`.novaway/powersnexus/changes/absorb-v6.4-behavior-fixes/design.md`
> 关联提议：`proposal.md`
> 关联规格：`delta-specs/`

---

## 1. Technical Approach

以 `obra/main`（v6.4.2）为来源，机械文件直接移植并本地化，`finishing`/`find-polluter` 逐项应用增量。不 merge（会回退品牌/删 CLAUDE.md）。

---

## 2. Architecture Decisions

### ADR-1: 测试分层按入口归属，不混用 core

**状态：** Accepted

**背景：** `test:core` = `node tests/run-tests.mjs`（固定 `.mjs/.ts` 清单，`node --test` 不认识 `.sh`）。

**决策：** 新增 shell 测试（find-polluter、hooks）登记进 `tests/run-platform-tests.sh` 的 `run_test` 列表；本变更无新增 Node 测试。

**后果：** 正面——core 纯 Node，shell 走 platform；负面——platform 门禁必须跑 Git Bash。

### ADR-2: REQ 编号与 delta 章节标题遵循 CLI 契约

**状态：** Accepted

**背景：** 归档 CLI 用 `/REQ-\d+/g` 与 `### REQ-<数字>` 识别需求，只认英文 `## ADDED Requirements` / `## MODIFIED Requirements` / `## REMOVED Requirements`。

**决策：** 全文使用 `REQ-001` 形式与英文章节标题；需求描述可用中文。

**后果：** 确保 `archive` 的 Brownfield 合并可执行。

### ADR-3: 交付 profile = library

**状态：** Accepted

**背景：** 本变更含可执行制品（hooks.json、shell 测试）。

**决策：** `delivery.json` 用 `library` profile，填写真实 argv：测试用 platform 套件命令。

**后果：** 交付门禁真实执行，非豁免。

---

## 3. File Changes

### 3.1 Modified Files

| 路径 | 变更 |
|------|------|
| `hooks/hooks.json` | SessionStart 命令加 `"shell": "bash"` |
| `hooks/session-start` | 上游 Windows/Muse 分支增量（若与本地兼容） |
| `skills/finishing-a-development-branch/SKILL.md` | 捕获 `WORKTREE_PATH` + removal-refused 处理 |
| `skills/systematic-debugging/find-polluter.sh` | `./` 前缀与 `**/` 折叠修复 |
| `tests/hooks/test-session-start.sh` | 新增 hooks.json `shell:bash` 断言 |
| `tests/run-platform-tests.sh` | 登记 find-polluter 测试 |
| `AGENTS.md` | 版本文件清单（本变更不动版本，仅在 platforms 变更更新） |

### 3.2 New Files

| 路径 | 说明 |
|------|------|
| `tests/systematic-debugging/test-find-polluter.sh` | find-polluter 平台测试 |

### 3.3 排除（本次不移植）

`tests/codex/test-package-codex-plugin.sh`、`tests/codex/test-marketplace-manifest.sh`、`tests/writing-skills/test-render-graphs.sh`、`tests/pi/test-pi-extension.mjs`（理由见 proposal 排除表）。

---

## 4. 需求映射

| 需求 | 实现文件 | 验证 |
|------|----------|------|
| REQ-001 | `hooks/hooks.json` | `tests/hooks/test-session-start.sh` |
| REQ-002 | `skills/finishing-a-development-branch/SKILL.md` | `tests/claude-code/test-worktree-path-policy.sh` |
| REQ-003 | `skills/systematic-debugging/find-polluter.sh` | `tests/systematic-debugging/test-find-polluter.sh` |

---

## 5. 归档工件

| 工件 | 要求 |
|------|------|
| `tasks.md` | 带 `- [ ]` checklist，覆盖 REQ-001..003 |
| `cross-reference.md` | REQ ↔ 任务 ↔ 文件 |
| `traceability.md` | 每 REQ 的实现文件 + 测试文件；路径必须真实存在 |
| `process-declaration.md` | 声明级别 / 遵循步骤 / 跳过与理由 / 审查记录 / 用户确认 |
| `delivery.json` | `library` profile + 真实 argv |

---

## 6. Risk Assessment

| 风险 | 可能性 | 影响 | 缓解 | 预警 |
|------|--------|------|------|------|
| 本地 `task-done` 现有 `bash -n` 语法错误被新测试暴露 | 中 | 中 | 本变更不涉及 executing-plans；若 platform 测试误触，记录并转 skills 变更 | `bash -n` 报错 |
| shell 测试在 Windows 路径形式差异下失败 | 中 | 中 | find-polluter 测试用 stub 与相对路径，避免 `E:/` vs `/tmp` 断言 | platform 测试失败 |
| 覆盖 finishing 本地措辞触发 worktree 路径策略测试 | 低 | 中 | 保留 `.worktrees/` 归属措辞 | `test-worktree-path-policy.sh` |
| hooks 脚本上游分支与本地不兼容 | 低 | 中 | 仅取 `shell:bash` 声明；脚本增量逐行核对 | hooks 测试失败 |

---

## 7. Testing Strategy

| 内容 | 命令 | 层级 |
|------|------|------|
| core 无回归 | `npm run test:core` | core |
| find-polluter | `bash tests/run-platform-tests.sh` | platform |
| hooks 声明与协议 | `bash tests/hooks/test-session-start.sh` | platform |
| 全量 | `npm test` + `npm run test:platform` | — |

---

**文档版本：** v1.0
**创建日期：** 2026-09-30
