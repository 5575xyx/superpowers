# 文档交叉引用映射

> 路径：`.novaway/powersnexus/changes/absorb-v6.4-platforms/cross-reference.md`

---

## 文档总览

| 文档 | 路径 | 版本 | 状态 |
|------|------|------|------|
| Proposal | `proposal.md` | v1.0 | Approved |
| Delta Specs | `delta-specs/plugins/spec.md` | v1.0 | Approved |
| Design | `design.md` | v1.0 | Approved |
| Tasks | `tasks.md` | v1.0 | Pending |
| 流程声明 | `process-declaration.md` | v1.0 | Draft |

---

## 模块状态

| 模块 | 状态 | 变更模式 |
|------|------|----------|
| plugins | 不存在主规格（首次） | Greenfield |

---

## 需求 ↔ 任务映射

| 需求 | 对应任务 |
|------|----------|
| REQ-001 Muse 清单 | 1.1 |
| REQ-002 Devin 清单 | 2.1 |
| REQ-003 Hermes 清单 | 3.1, 3.2 |
| REQ-004 版本一致性 + bump | 4.1, 4.2, 4.3 |

---

## 任务 ↔ 文件映射

| 任务 | 文件 |
|------|------|
| 1.1 | `.muse-plugin/plugin.json`、`.muse-plugin/marketplace.json`、`skills/using-powersnexus/references/muse-tools.md` |
| 2.1 | `.devin-plugin/plugin.json`、`tests/devin/test-devin-plugin.sh`、`skills/using-powersnexus/references/hermes-tools.md` |
| 3.1 | `.hermes-plugin/plugin.yaml`、`.hermes-plugin/__init__.py` |
| 3.2 | `tests/hermes/*`、`.github/workflows/test.yml`、`package.json` |
| 4.1 | `.version-bump.json`、`scripts/bump-version.sh`、`tests/version-consistency.test.mjs`、`AGENTS.md` |
| 4.2 | `package.json` 及全部清单、`tests/version-bump/test-bump-version.sh` |
| 4.3 | `.npmignore` |

---

## 验收条件 ↔ 验证映射

| 验收条件 | 验证方式 |
|----------|----------|
| 三平台清单本地化 | 人工复核 + `tests/devin/test-devin-plugin.sh` + `pytest tests/hermes` |
| Muse skills[] 一致 | 人工复核（对比 `skills/` 目录） |
| 版本成套 | `tests/version-consistency.test.mjs`、`tests/version-bump/test-bump-version.sh` |
| 发布包无缓存 | `tests/package-artifact.test.mjs` |

---

**文档版本：** v1.0
**创建日期：** 2026-09-30
