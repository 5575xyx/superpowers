# Proposal: 吸收上游 v6.4 平台支持与版本一致性

> 路径：`.novaway/powersnexus/changes/absorb-v6.4-platforms/proposal.md`
> 用途：新增 Muse/Devin/Hermes 平台支持，扩展版本一致性并 bump 6.3.0

---

## 1. Intent（意图）

### Problem Statement

上游 v6.3/v6.4 新增 Muse、Devin、Hermes 三个 harness 支持及配套测试。本仓库尚无这些清单；同时 `version-consistency` 与 `bump-version.sh` 只覆盖 7 个文件，且无 YAML 版本文件处理能力。若不扩展，新平台清单会游离于成套约束之外，再次漂移。

### Goal

新增三平台清单（本地化）、扩展版本一致性与 bump 脚本覆盖新平台、移植对应测试与 CI Job，并 bump `6.2.0 → 6.3.0`。

### Success Criteria

1. `.muse-plugin/`、`.devin-plugin/`、`.hermes-plugin/` 清单存在且品牌本地化；Muse 的 `capabilities.skills[]` 与 `skills/` 实际目录一致（以 `using-powersnexus` 为入口）。
2. 新增 `skills/using-powersnexus/references/hermes-tools.md`、`muse-tools.md`。
3. `.version-bump.json` 与 `tests/version-consistency.test.mjs` 覆盖新平台；`bump-version.sh` 支持 YAML（`yq`）。
4. 版本 `6.3.0` 成套一致；`npm run test:core` 的 version-consistency 通过。
5. `tests/devin/test-devin-plugin.sh`、`tests/hermes/*`、`tests/version-bump/test-bump-version.sh` 移植；Hermes pytest 走独立 CI Job。
6. `npm run test:core`、`npm run test:package`、`npm run test:platform` 通过。

### 创建模式

- 目标模块：`plugins`（无主规格，**Greenfield**）、`hooks`（既有，**Brownfield**，Muse 的 session-start 分支）
- 模式：**Mixed（C）**

### 执行顺序

本变更**最后执行**：变更 A/B 完成并归档后再 bump 版本，避免中途改变交付指纹。

---

## 2. Scope（范围）

| REQ | 交付物 | 上游依据 |
|-----|--------|----------|
| REQ-001 | `.muse-plugin/plugin.json` + `marketplace.json` | v6.4.1 Muse |
| REQ-002 | `.devin-plugin/plugin.json` | v6.3.0 Devin |
| REQ-003 | `.hermes-plugin/plugin.yaml` + `__init__.py` | v6.3.0 Hermes |
| REQ-004 | 版本一致性扩展 + bump 6.3.0 | AGENTS.md 成套要求 |

附带：`using-powersnexus/references/{hermes,muse}-tools.md`、`hooks/session-start` Muse 分支、`.version-bump.json`、`scripts/bump-version.sh`、`tests/version-consistency.test.mjs`、`AGENTS.md`、CI Job。

### 明确不做

- 不吸收 codex package/marketplace、render-graphs、pi（见排除表）。
- 不改动行为修复与技能内容（属 A/B）。
- 不引入运行时依赖。

### 排除表

| 上游测试 | 对应功能 | 理由 |
|----------|----------|------|
| `tests/codex/test-package-codex-plugin.sh` | Codex portal 打包 | gitee 发布不需要 |
| `tests/codex/test-marketplace-manifest.sh` | Codex marketplace | 本仓库 codex 清单已本地化 |
| `tests/writing-skills/test-render-graphs.sh` | render-graphs | 依赖 Graphviz |
| `tests/pi/test-pi-extension.mjs` | pi 扩展 | 未纳入 pi harness |

---

## 3. Approach（方法）

平台清单不整文件照搬：以本地 `skills/` 目录为准重建 Muse `capabilities.skills[]`，其余字段本地化品牌。版本一致性扩展点：`.version-bump.json`（真正的驱动）+ `tests/version-consistency.test.mjs` 硬编码数组 + `AGENTS.md` 清单；YAML 版本用最小正则校验。

---

## 4. 变更清单核对

- [ ] REQ-001 Muse 清单（skills[] 与本地一致）
- [ ] REQ-002 Devin 清单
- [ ] REQ-003 Hermes 清单 + loader
- [ ] REQ-004 版本一致性扩展 + bump 6.3.0
- [ ] Hermes/hooks tools 引用
- [ ] 测试与 CI Job
- [ ] `npm run test:core` / `test:platform` / `test:package` 通过

---

**文档版本：** v1.0
**创建日期：** 2026-09-30
