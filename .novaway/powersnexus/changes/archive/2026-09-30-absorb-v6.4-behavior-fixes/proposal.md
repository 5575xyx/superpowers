# Proposal: 吸收上游 v6.4 行为修复

> 模板来源：PowersNexus OpenSpec
> 路径：`.novaway/powersnexus/changes/absorb-v6.4-behavior-fixes/proposal.md`
> 用途：落地上游 v6.2/v6.3 三项已验证的行为修复（不涉及版本与平台）

---

## 1. Intent（意图）

### Problem Statement

上游 obra/superpowers v6.2/v6.3 修复了若干在本仓库仍存在的缺陷：

1. **Windows SessionStart 静默失效**：`hooks/hooks.json` 的命令以带引号路径开头，Claude Code 交给 PowerShell 时解析报错、交给 cmd 时引号被剥离截断，导致引导从未注入。
2. **finishing worktree 清理两处缺陷**：`WORKTREE_PATH` 在切换到主仓库后重算，provenance 检查永不匹配→清理静默 no-op；`git worktree remove` 被拒时（存在未提交文件）上游要求列文件请示而非 `--force`，本仓库缺失。
3. **find-polluter 模式不匹配**：`find .` 输出 `./` 前缀，文档化的 `-path "src/**/*.test.ts"` 模式匹配不到，`wc -l` 在空输入上还误报 "Found 1"。

### Goal

按上游已验证结论落地三项修复及其测试，不改版本号、不动 PowersNexus 品牌与 L0-L4 流程。

### Success Criteria

1. `hooks/hooks.json` 的 SessionStart 命令含 `"shell": "bash"`；`tests/hooks/test-session-start.sh` 新增该断言并通过。
2. `finishing-a-development-branch` 在切换目录前捕获 `WORKTREE_PATH`，并在 removal refused 时列出未提交文件请示，不自行 `--force`。
3. `find-polluter.sh` 的 `./` 前缀与 `**/` 折叠匹配修复；`tests/systematic-debugging/test-find-polluter.sh` 通过并登记进 platform 套件。
4. `npm run test:core` 无回归。

### 创建模式

- 目标模块：`hooks`（主规格已存在）、`skills`（尚未建立主规格）
- 模式：**Mixed（C）** — 混合：hooks 追加需求，skills 归档时首次建立主规格

---

## 2. Scope（范围）

| REQ | 交付物 | 上游依据 |
|-----|--------|----------|
| REQ-001 | `hooks/hooks.json` 加 `shell: "bash"`；`tests/hooks/test-session-start.sh` 增加断言 | v6.2.0 Windows SessionStart 修复 |
| REQ-002 | `skills/finishing-a-development-branch/SKILL.md` 两处修复 | v6.2.0 / v6.3.0 |
| REQ-003 | `skills/systematic-debugging/find-polluter.sh` 修复 + 新增测试 | v6.2.0 find-polluter 修复 |

### 明确不做

- 不 bump 版本（留待 `absorb-v6.4-platforms`）。
- 不吸收 `skills/writing-plans`、`brainstorming`、`diagnosing-superpowers`（属 `absorb-v6.4-skills`）。
- 不吸收平台清单与版本一致性扩展（属 `absorb-v6.4-platforms`）。
- 不吸收未纳入范围的上游功能与其测试（见排除表）。

### 排除表（上游有测试但本次不移植）

| 上游测试 | 对应功能 | 理由 |
|----------|----------|------|
| `tests/codex/test-package-codex-plugin.sh` | `scripts/package-codex-plugin.sh` | 上游 Codex portal 打包工具，本仓库 gitee 发布不需要 |
| `tests/codex/test-marketplace-manifest.sh` | `.agents/plugins/marketplace.json` + `.codex-plugin` `hooks:{}` | 上游 Codex marketplace 形态，本仓库 codex 清单已本地化 |
| `tests/writing-skills/test-render-graphs.sh` | `skills/writing-skills/render-graphs.js` 改动 | 依赖 Graphviz `dot`，本机缺失；非本次交付 |
| `tests/pi/test-pi-extension.mjs` | `pi` 扩展改动 | 本仓库未纳入 pi harness |

---

## 3. Approach（方法）

机械文件直接 `git checkout obra/main -- <path>` 拉取后本地化；`finishing`/`find-polluter` 逐项应用增量，保留本地品牌与措辞。

品牌与路径映射：

| 上游 | 本仓库 |
|------|--------|
| `superpowers:` | `PowersNexus:` |
| `.superpowers/sdd` | `.powersnexus/sdd` |
| `skills/using-superpowers/` | `skills/using-powersnexus/` |

---

## 4. 变更清单核对

- [ ] REQ-001 hooks `shell: "bash"` + 断言
- [ ] REQ-002 finishing worktree 两处修复
- [ ] REQ-003 find-polluter 修复 + 测试
- [ ] `npm run test:core` 无回归
- [ ] platform find-polluter 测试通过

---

**文档版本：** v1.0
**创建日期：** 2026-09-30
