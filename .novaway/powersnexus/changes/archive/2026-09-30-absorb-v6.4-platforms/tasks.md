# absorb-v6.4-platforms Implementation Plan

> 路径：`.novaway/powersnexus/changes/absorb-v6.4-platforms/tasks.md`
> 关联设计：`design.md`

**Goal:** 新增三平台清单、扩展版本一致性并 bump 6.3.0，移植测试与 CI Job。

**Architecture:** 以本地 `skills/` 目录为准重建三平台清单；`.version-bump.json` 为版本驱动，同步 `version-consistency.test.mjs` 与 `AGENTS.md`；Hermes 走独立 CI Job。

**Tech Stack:** Node.js ≥22、Bash、Python3+pytest（Hermes）、yq（可选发布工具）。

**Spec:** `design.md`、`delta-specs/plugins/spec.md`

**Related Requirements:** REQ-001, REQ-002, REQ-003, REQ-004

## Review Focus

- 缺 `yq` 时 bump-version.sh 是否明确报错而非静默 → 由 4.1 的脚本行为覆盖。
- Muse `capabilities.skills[]` 是否与本地技能漂移 → 由 1.1 人工核对覆盖。
- Hermes pytest 生成的 `__pycache__/` 是否混入发布包 → 由 4.3 的 `test:package` 覆盖。
- 版本 bump 时序是否早于 A/B 归档致交付指纹失效 → 由执行前提（A、B 先归档）覆盖。

**执行前提：** 变更 A、B 已完成并归档。

---

## Global Constraints

- 不引入运行时依赖；`yq` 为发布工具依赖（可选，缺失时明确提示）。
- 新文件（`.json`/`.yaml`/`.sh`）不得带 UTF-8 BOM。
- 版本统一为 6.3.0，成套一致。

---

## Acceptance Criteria

| 验收标准 | 对应任务 | 验证方法 |
|----------|----------|----------|
| 三平台清单本地化且 Muse skills[] 一致 | 1.1, 2.1, 3.1 | 人工复核 + `tests/devin/test-devin-plugin.sh` |
| Hermes pytest 通过 | 3.2 | `pytest tests/hermes` |
| 版本一致性扩展 + bump | 4.1, 4.2 | `npm run test:core` |
| 发布包无 `__pycache__` | 4.3 | `npm run test:package` |

---

## Tasks

### Section 1: Muse

- [x] 1.1.1 新增 `.muse-plugin/plugin.json`、`marketplace.json`，品牌本地化。
- [x] 1.1.2 按 `skills/` 实际目录重建 `capabilities.skills[]`（入口 `using-powersnexus`）。
- [x] 1.1.3 新增 `skills/using-powersnexus/references/muse-tools.md`。

### Section 2: Devin

- [x] 2.1.1 新增 `.devin-plugin/plugin.json`（本地化）。
- [x] 2.1.2 移植 `tests/devin/test-devin-plugin.sh` 并本地化断言。
- [x] 2.1.3 新增 `skills/using-powersnexus/references/hermes-tools.md`。

### Section 3: Hermes

- [x] 3.1.1 新增 `.hermes-plugin/plugin.yaml`、`__init__.py`（本地化品牌 marker）。
- [x] 3.2.1 移植 `tests/hermes/*` 并同步品牌 marker。
- [x] 3.2.2 本地运行 `pytest tests/hermes` 通过。
- [x] 3.2.3 在 `.github/workflows/test.yml` 新增 Hermes Job；`package.json` 加 script。

### Section 4: 版本一致性

- [x] 4.1.1 扩展 `.version-bump.json` 登记三平台清单。
- [x] 4.1.2 移植 `scripts/bump-version.sh` 的 YAML 支持（yq）并 `require_tool yq`。
- [x] 4.1.3 扩展 `tests/version-consistency.test.mjs`（新清单 + YAML 正则）。
- [x] 4.1.4 更新 `AGENTS.md` 版本文件清单。
- [x] 4.2.1 bump 6.3.0：改 `package.json` 与全部清单；`npm run test:core` 通过。
- [x] 4.2.2 移植 `tests/version-bump/test-bump-version.sh` 并登记 platform。
- [x] 4.3.1 `.npmignore` 加 `__pycache__/`、`*.pyc`；`npm run test:package` 通过。

### Section 5: 验证

- [x] 5.1.1 `npm run test:core`、`npm run test:platform`、`npm run test:package` 通过。
- [x] 5.1.2 生成 `delivery.json` 并 `powersnexus verify delivery absorb-v6.4-platforms`。

---

## Progress Ledger

| 任务 | 状态 | 完成时间 | 审查意见 |
|------|------|----------|----------|
| 1.1 | 🔄 | | |
| 2.1 | 🔄 | | |
| 3.1 | 🔄 | | |
| 3.2 | 🔄 | | |
| 4.1 | 🔄 | | |
| 4.2 | 🔄 | | |
| 4.3 | 🔄 | | |
| 5.1 | 🔄 | | |

---

**文档版本：** v1.0
**创建日期：** 2026-09-30
