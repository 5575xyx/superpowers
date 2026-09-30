# PowersNexus ledger — plan: .novaway/powersnexus/changes/absorb-v6.4-platforms/tasks.md

> 执行者：Native（executing-plans）｜开始：2026-09-30

## Pre-flight

任务共享接口：

- `package.json` version — REQ-001..004 的版本一致性共享（bump 为最后一步）。
- `.version-bump.json` — 版本驱动，bump 与测试共享。

`Pre-flight: no cross-task shared interfaces`（以版本为唯一交汇，已在 bump 阶段统一）。

## Rulings

- 路径修正：上游引用目录为 `skills/using-superpowers/`，本地为 `skills/using-powersnexus/`；`hermes-tools.md`/`muse-tools.md` 已迁入本地目录，删除误建的 `using-superpowers`。成本：否。
- 品牌替换大小写：PowerShell `-replace` 大小写不敏感导致 `using-superpowers`→`using-PowersNexus`、命名空间大写；已二次修正为 `using-powersnexus`/`powersnexus:`。
- `using-powersnexus/SKILL.md` 本地含 UTF-8 BOM + `name: using-PowersNexus`，导致 Hermes `_strip_frontmatter` 失败；移除 BOM 并规范 name。成本：低（仅该文件）。
- 本机缺 `jq`/`yq`：`tests/version-bump/test-bump-version.sh` 本机跳过，改由 CI platform Job 安装 `yq` 后执行；本机以 `core` + `platform`（除该测试）为准。成本：本机未本地验证 bump 脚本，依赖 CI。
- `test:all` 不含 Hermes：Hermes pytest 走独立 CI Job（`.github/workflows/test.yml` 第 5 Job），因需 Python 环境；AGENTS.md 未改 job 描述（保持 core/uiux/platform/package 四 Job 的本地门禁说明）。

## Log

- REQ-001: complete — `.muse-plugin/plugin.json`（23 技能，`using-powersnexus` 入口）+ `marketplace.json`，品牌本地化。
- REQ-002: complete — `.devin-plugin/plugin.json`；`tests/devin/test-devin-plugin.sh` PASS。
- REQ-003: complete — `.hermes-plugin/plugin.yaml` + `__init__.py` 本地化；`tests/hermes/*` pytest 19 passed；`using-powersnexus/references/{hermes,muse}-tools.md` 迁入。
- REQ-004: complete — `.version-bump.json`/`version-consistency.test.mjs`/`AGENTS.md` 覆盖新平台；`bump-version.sh` 移植 YAML（yq）；bump 6.3.0 成套；core 107/107。
- 其他：`.npmignore` 加 `__pycache__/`、`*.pyc`；CI 加 Hermes Job、platform 安装 yq；`package.json` 加 `test:hermes`。
- 变更 C 交付完成：`npm run test:platform` 全通过；`npm run test:package` 通过；`verify delivery` 通过（100%）。
