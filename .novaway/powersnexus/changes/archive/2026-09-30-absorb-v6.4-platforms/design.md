# Design: absorb-v6.4-platforms

> 路径：`.novaway/powersnexus/changes/absorb-v6.4-platforms/design.md`
> 关联提议：`proposal.md`
> 关联规格：`delta-specs/plugins/spec.md`

---

## 1. Technical Approach

以本地 `skills/` 目录为准重建三平台清单（不整文件照搬），扩展 `.version-bump.json` 与 `tests/version-consistency.test.mjs`，移植 Devin/Hermes/version-bump 测试，Hermes 走独立 CI Job，最后统一 bump `6.3.0`。

---

## 2. Architecture Decisions

### ADR-1: REQ 编号与 delta 章节标题遵循 CLI 契约

**状态：** Accepted
**决策：** `REQ-00X` + 英文 `## ADDED Requirements`；plugins 为 Greenfield，仅 ADDED。

### ADR-2: 平台清单按本地技能列表重建，不整文件照搬

**状态：** Accepted
**背景：** 上游 Muse `capabilities.skills[]` 引用 `using-superpowers` 且不含本地独有技能。
**决策：** 以 `skills/` 实际目录生成 Muse `skills[]`（入口 `using-powersnexus`），其余清单字段本地化品牌后采用。
**后果：** 避免孤儿技能引用；需人工核对一次列表。

### ADR-3: 版本驱动的三处登记点

**状态：** Accepted
**背景：** `bump-version.sh` 读 `.version-bump.json`；`version-consistency.test.mjs` 用硬编码数组；`AGENTS.md` 列清单。
**决策：** 三处同步登记新平台清单；`.version-bump.json` 为权威驱动。
**后果：** 遗漏任一处即一致性失败，测试会暴露。

### ADR-4: YAML 版本用最小正则校验，bump 依赖 yq

**状态：** Accepted
**背景：** `version-consistency.test.mjs` 用 `JSON.parse`，无法读 `.hermes-plugin/plugin.yaml`；上游 `bump-version.sh` 用 `yq` 读写 YAML。
**决策：** YAML 清单在一致性测试中用 `^version:\s*(\S+)` 正则读取；`bump-version.sh` 移植上游 YAML 支持并 `require_tool yq`，缺 `yq` 时明确报错而非静默。
**后果：** 新增发布工具依赖 `yq`；本机可能缺失，需在 CI 与 AGENTS.md 说明。

### ADR-5: Hermes 走独立 CI Job

**状态：** Accepted
**决策：** 新增独立 CI Job 跑 Hermes pytest（`.github/workflows/test.yml` 第 5 个 Job），`package.json` 增加 `test:hermes` script。**不并入** `test:all`——`test:all` 保持四步本地门禁（core→uiux→platform→package），Hermes 因需 Python 环境作为独立 CI 验证。
**后果：** CI 需安装 Python3 + pytest。

### ADR-6: 交付 profile = library

**状态：** Accepted
**决策：** `delivery.json` 用 `library`；argv 覆盖 core、platform、package。

---

## 3. File Changes

### 3.1 New Files

| 路径 | 说明 |
|------|------|
| `.muse-plugin/plugin.json`、`.muse-plugin/marketplace.json` | Muse 清单 |
| `.devin-plugin/plugin.json` | Devin 清单 |
| `.hermes-plugin/plugin.yaml`、`.hermes-plugin/__init__.py` | Hermes 清单与 loader |
| `skills/using-powersnexus/references/hermes-tools.md`、`muse-tools.md` | 工具映射引用 |
| `tests/devin/test-devin-plugin.sh` | Devin 清单测试 |
| `tests/hermes/{__init__.py,conftest.py,test_bootstrap.py,test_plugin.py}` | Hermes pytest |
| `tests/version-bump/test-bump-version.sh` | 版本脚本测试 |

### 3.2 Modified Files

| 路径 | 变更 |
|------|------|
| `.version-bump.json` | 登记三平台清单（版本驱动） |
| `scripts/bump-version.sh` | 移植 YAML 支持（yq） |
| `tests/version-consistency.test.mjs` | `versionFiles` 加新清单 + YAML 正则 |
| `AGENTS.md` | 版本文件清单同步 |
| `package.json` | 版本 6.3.0 + Hermes script |
| `.github/workflows/test.yml` | 新增 Hermes Job |
| `tests/run-platform-tests.sh` | 登记 devin/version-bump 测试 |
| `.npmignore` | 加 `__pycache__/`、`*.pyc`（保留三平台清单目录入包） |

### 3.3 评估后不改

`hooks/session-start`：本地已有等价逻辑，Muse hook 声明放入 `.muse-plugin/`，不修改共享脚本，避免破坏既有分支。

### 3.4 排除（不移植）

`tests/codex/*`、`tests/writing-skills/test-render-graphs.sh`、`tests/pi/test-pi-extension.mjs`。

---

## 4. 需求映射

| 需求 | 实现文件 | 验证 |
|------|----------|------|
| REQ-001 | `.muse-plugin/plugin.json` | `tests/version-consistency.test.mjs` |
| REQ-002 | `.devin-plugin/plugin.json` | `tests/devin/test-devin-plugin.sh` |
| REQ-003 | `.hermes-plugin/__init__.py` | `tests/hermes/test_plugin.py` |
| REQ-004 | `.version-bump.json` | `tests/version-bump/test-bump-version.sh` |

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
| `yq` 缺失导致 bump 失败 | 高 | 中 | 明确 `require_tool yq` 提示；CI 安装；本机人工复核 | bump 报错 |
| 三处登记点只改部分致一致性失败 | 中 | 高 | 同时改 `.version-bump.json`+测试+AGENTS | `version-consistency` 失败 |
| Muse `skills[]` 与本地漂移 | 中 | 中 | 按 `skills/` 目录生成并核对 | 引用不存在技能 |
| Hermes pytest 生成 `__pycache__` 进发布包 | 中 | 中 | `.npmignore` 加 `__pycache__/`、`*.pyc` | `test:package` 断言失败 |
| bump 时序早于 A/B 致指纹失效 | 中 | 高 | 本变更最后执行 | 交付证据过期 |
| Hermes 测试品牌 marker 未本地化 | 中 | 中 | 同步测试与实现 marker | Hermes Job 失败 |
| `.codex-plugin` 同步脚本带入新目录 | 低 | 低 | `sync-to-codex-plugin.sh` EXCLUDES 加新目录 | 同步回归失败 |

---

## 7. Testing Strategy

| 内容 | 命令 | 层级 |
|------|------|------|
| 版本一致性 | `npm run test:core` | core |
| Devin/version-bump | `bash tests/run-platform-tests.sh` | platform |
| Hermes | `pytest tests/hermes`（独立 Job） | hermes |
| 发布包 | `npm run test:package` | package |
| 全量 | `npm run test:all` | — |

---

**文档版本：** v1.0
**创建日期：** 2026-09-30
