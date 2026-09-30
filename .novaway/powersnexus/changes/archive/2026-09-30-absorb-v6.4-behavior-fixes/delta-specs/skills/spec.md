# Delta Spec: skills 模块

> 路径：`.novaway/powersnexus/changes/absorb-v6.4-behavior-fixes/delta-specs/skills/spec.md`
> 变更模式：Greenfield（ADDED）— 本模块无既有主规格，归档时创建

---

## ADDED Requirements

### REQ-002: finishing-a-development-branch 修复 worktree 清理缺陷

**状态:** 已提议

**陈述：** 技能须在切换到主仓库根之前捕获 `WORKTREE_PATH`（用于 provenance 判定），并在 `git worktree remove` 被拒时停止、列出未提交文件、请示人类。

**验收：**

- 检测环境阶段（Step 2）即执行 `WORKTREE_PATH=$(git rev-parse --show-toplevel)`，清理阶段复用该值，不重算。
- removal refused（提示 `contains modified or untracked files`）时，用 `git status --porcelain -uall` 列出文件，给出「提交 / 移出 / 删除」三选项并等待选择；未获确认前禁止 `--force`。
- 保留 `.worktrees/` 或 `worktrees/` 归属措辞（provenance 判定），不引入 `~/.config/PowersNexus/worktrees` 之类全局路径。

### REQ-003: find-polluter.sh 修复 ./ 前缀与 **/ 折叠匹配

**状态:** 已提议

**陈述：** `find-polluter.sh` 须正确处理 `find .` 输出的 `./` 前缀路径，使调用方传入的 `./` 前缀模式不被二次加前缀，且 `**/` 折叠匹配同时覆盖顶层测试文件。

**验收：**

- 传入 `src/**/*.test.ts` 能匹配 `./src/a/b.test.ts`；传入 `./src/**/*.test.ts` 不被二次前缀化为永不匹配形式。
- `src/top.test.ts`（`**/` 折叠）能被匹配。
- 空输入不再误报 "Found 1"。
- `tests/systematic-debugging/test-find-polluter.sh` 通过并登记进 platform 套件。

---

**文档版本：** v1.0
