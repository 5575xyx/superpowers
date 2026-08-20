# AGENTS.md

贡献与 PR 准则见 [CLAUDE.md](CLAUDE.md)。

## 项目定位

这不是一个应用仓库，而是 **PowersNexus 技能/插件框架本身**（superpowers 的中文化分叉）。运行时零依赖（`package.json` 仅 `devDependencies.tsx`）。OpenCode 插件入口为 `.opencode/plugins/powersnexus.js`（`package.json` 的 `main`），CLI 入口为 `src/cli/powersnexus-cli.js`。不要为 `package.json` 新增运行时依赖。

## 语言强制规范

所有回复、文档、代码注释、提交信息、测试描述一律使用简体中文。唯一例外：代码标识符沿用英文。测试断言文案即按此规范编写，被 `tests/version-consistency.test.mjs` 等文件校验。

## 验证命令（无独立 lint/typecheck，测试即门禁）

- `npm run test:core`（或 `npm test`）— 核心套件，Node 22 + tsx 运行 `node --test`，本机快速验证用这个。
- `npm run test:uiux` — 需 Python 3，验证内置 UI/UX 检索器。
- `npm run test:platform` — 需 Bash（Windows 上用 Git Bash 执行，PowerShell 下会失败）；CI 中设 `PowersNexus_REQUIRE_RSYNC_TESTS=1` 且依赖 rsync。
- `npm run test:package` — 校验 npm 发布包内容。
- `npm run test:all` — 完整发布门禁（core → uiux → platform → package），Windows 需在 Git Bash 中运行。

注意：`.sh`、`.cmd`、`.json` 文件禁止带 UTF-8 BOM，被 `tests/executable-script-encoding.test.mjs` 强制检查。

## 版本一致性（改版本必须成套）

`package.json` 版本必须与 `.claude-plugin/plugin.json`、`.claude-plugin/marketplace.json` 的 `plugins[0].version`、`.codex-plugin/plugin.json`、`.cursor-plugin/plugin.json`、`.kimi-plugin/plugin.json`、`gemini-extension.json` 一致。用 `scripts/bump-version.sh <版本>` 成套更新，`npm run test:core` 会校验。

## 工作流文档与 CLI

- 标准流程按 `skills/using-powersnexus` 的 L0-L4 路由：L0 直接改测、L1 简短假设、L2+ 走设计契约与文档。创建/修改功能前 `brainstorming` 技能必须先行。
- L2+ 变更文档统一放 `.novaway/powersnexus/changes/<name>/`（`proposal.md`、`design.md`、`tasks.md`、`delta-specs/`），完成后归档合并回 `.novaway/powersnexus/specs/`。
- CLI（`npm link` 后为 `powersnexus`，否则 `node src/cli/powersnexus-cli.js`）：`start`、`check consistency`、`init delivery`、`verify delivery`、`check delivery`、`archive`、`trace`、`next`、`checkpoint`、`telemetry`、`doctor`。归档前必须先通过 `check delivery`。

## 技能改动守则

技能是塑造代理行为的代码，不是散文。改动技能内容须用 `writing-skills` 技能开发、给出评估证据，不得仅因"与 Anthropic 文档一致"而重构经过调优的措辞（见 CLAUDE.md）。

## 环境与 Git

> 以下为本仓库实例配置。fork 后按你自己的远程地址与工作分支修改，框架本身不绑定特定仓库。

- 本机开发环境为 Windows，默认 shell 是 PowerShell；平台相关测试须切到 Git Bash。
- `.opencode/bin/rg.exe` 是内置 ripgrep，插件启动时加入 PATH，勿删。
- 远程（本仓库实例）：`gitee` = nova-way/powersnexus（主要发布目标），`origin` = 5575xyx/superpowers（上游分叉）。当前工作分支为 `main`；对上游提 PR 时目标分支应为 `dev`。未获明确授权不要 push。
