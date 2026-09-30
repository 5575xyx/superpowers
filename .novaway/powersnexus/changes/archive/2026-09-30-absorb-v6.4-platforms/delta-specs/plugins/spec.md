# Delta Spec: plugins 模块

> 路径：`.novaway/powersnexus/changes/absorb-v6.4-platforms/delta-specs/plugins/spec.md`
> 变更模式：Greenfield（ADDED）— 归档时创建 `specs/plugins/spec.md`

---

## ADDED Requirements

### REQ-001: 新增 Muse 平台清单

**状态:** 已提议

**陈述：** 新增 `.muse-plugin/plugin.json` 与 `.muse-plugin/marketplace.json`，品牌本地化为 PowersNexus。

**验收：**

- `muse plugins install ./` 可识别清单。
- `capabilities.skills[]` 与 `skills/` 实际目录一致，以 `using-powersnexus` 为入口；含本地独有技能（grill-me、task-size-assessor、openspec、frontend-quality、ui-ux-pro-max、decision-expert、exploration、red-team 等）。
- 无 `obra/superpowers`、`using-superpowers` 残留。
- `hooks/session-start` 的 Muse 分支（`MUSE_PLUGIN_ROOT`）与既有分支兼容。

### REQ-002: 新增 Devin 平台清单

**状态:** 已提议

**陈述：** 新增 `.devin-plugin/plugin.json`，品牌本地化。

**验收：**

- `tests/devin/test-devin-plugin.sh` 通过（断言的 manifest `name` 为本地名称）。
- 清单不含 `skills`/`hooks`/`commands` 等非法字段。

### REQ-003: 新增 Hermes 平台清单

**状态:** 已提议

**陈述：** 新增 `.hermes-plugin/plugin.yaml` 与 `.hermes-plugin/__init__.py`，品牌本地化，loader 在首轮注入 bootstrap。

**验收：**

- `tests/hermes/*`（pytest）通过（bootstrap marker、plugin 加载、skill 视图按本地品牌断言）。
- `conftest.py`/`test_bootstrap.py` 中的品牌 marker 与本地实际注入文案一致。

### REQ-004: 版本一致性扩展并 bump 6.3.0

**状态:** 已提议

**陈述：** 版本成套管理扩展到新平台清单，`package.json` 版本为 `6.3.0`。

**验收：**

- `.version-bump.json` 登记 `.muse-plugin/plugin.json`、`.muse-plugin/marketplace.json`、`.devin-plugin/plugin.json`、`.hermes-plugin/plugin.yaml`。
- `tests/version-consistency.test.mjs` 的 `versionFiles` 覆盖新清单；YAML 使用最小正则校验 `^version:\s*(\S+)`。
- `scripts/bump-version.sh` 支持 YAML（依赖 `yq`），本机缺 `yq` 时给出明确提示。
- `package.json`、`.claude-plugin/plugin.json`、`.claude-plugin/marketplace.json`（`plugins[0].version`）、`.codex-plugin/plugin.json`、`.cursor-plugin/plugin.json`、`.kimi-plugin/plugin.json`、`gemini-extension.json` 与新增清单版本一致为 `6.3.0`。
- `AGENTS.md` 版本文件清单同步更新。
- `tests/version-bump/test-bump-version.sh` 通过。

---

**文档版本：** v1.0
