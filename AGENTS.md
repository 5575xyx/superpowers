# AGENTS.md

贡献与 PR 规则、完整流程约束见 `CLAUDE.md`；本文件仅保留高价值仓库事实。

## 项目定位

- 本仓库是 **PowersNexus 技能/插件框架**，不是业务应用。
- 运行时零依赖；`package.json` 仅包含 `tsx` 开发依赖。不要新增运行时依赖。
- OpenCode 插件入口：`.opencode/plugins/powersnexus.js`（`package.json.main`）。
- CLI 入口：`src/cli/powersnexus-cli.js`；全局安装后命令名为 `powersnexus`。

## 语言与内容约束

- 文档、技能、测试描述、断言文案、提交信息统一使用简体中文。
- 代码标识符保持英文。
- 技能文本属于产品行为；不要为“措辞优化”随意改写，相关断言会校验关键文案。

## 测试与验证

> 本仓库没有独立 lint/typecheck 门禁，不要虚构相关命令。

- Node.js ≥ 22。
- 快速验证：`npm test` 或 `npm run test:core`。
- 单文件测试：
  - `.mjs`：`node --test tests/<file>.mjs`
  - `.ts` 测试：`node --import tsx --test tests/<file>.test.ts`
- UI/UX 检索器：`npm run test:uiux`（需要 Python 3）。
- 平台测试：`npm run test:platform`（必须使用 Git Bash；PowerShell 会失败）。
- 发布门禁：`npm run test:all`，固定顺序为 core → uiux → platform → package。
- 发布包校验：`npm run test:package`。
- `.sh`、`.cmd`、`.json` 禁止 UTF-8 BOM；相关测试会失败。

## 版本发布

- 版本号必须与以下文件保持一致：
  - `.claude-plugin/plugin.json`
  - `.claude-plugin/marketplace.json`
  - `.codex-plugin/plugin.json`
  - `.cursor-plugin/plugin.json`
  - `.kimi-plugin/plugin.json`
  - `.devin-plugin/plugin.json`
  - `.muse-plugin/plugin.json`
  - `.muse-plugin/marketplace.json`
  - `.hermes-plugin/plugin.yaml`
  - `gemini-extension.json`
- 使用 `scripts/bump-version.sh <version>` 统一升级；不要手动改单个文件。YAML 清单需要 `yq`，JSON 清单需要 `jq`。
- 修改版本后至少运行 `npm run test:core`。

## PowersNexus 工件与流程

- L2+ 变更统一存放在 `.novaway/powersnexus/changes/<change>/`。
- 主规格位于 `.novaway/powersnexus/specs/`。
- 归档前关键命令链：
  1. `powersnexus check delivery`
  2. `powersnexus audit`
  3. `powersnexus archive`
- `archive` 依赖前两步通过，否则不会写入主规格。

## 技能开发注意事项

- 修改技能前先查看对应测试，尤其是：
  - `tests/progressive-activation.test.mjs`
  - `tests/version-consistency.test.mjs`
- 技能变更应通过 `writing-skills` 工作流验证，而不是仅凭人工判断。
- 技能是行为代码，不是普通文档；测试约束优先于主观重构。

## 环境与仓库特性

- Windows 开发环境默认 PowerShell，但平台测试必须切换 Git Bash。
- 常见缺失工具：`jq`、`rsync`、`shellcheck`。
- 内置 ripgrep：`.opencode/bin/rg.exe`，不要删除。
- 当前仓库远程：
  - `gitee`：发布目标
  - `origin`：上游分叉
- 未获得明确授权不要执行 push。
- CI：`.github/workflows/test.yml`，包含 core、uiux、platform、package、hermes 五个 Job。
