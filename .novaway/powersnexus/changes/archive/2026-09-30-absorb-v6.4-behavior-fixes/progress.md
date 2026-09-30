# PowersNexus ledger — plan: .novaway/powersnexus/changes/absorb-v6.4-behavior-fixes/tasks.md

> 执行者：Native（executing-plans）｜开始：2026-09-30

## Pre-flight

任务共享接口：

- `hooks/hooks.json` — Task 1 内 1.1（实现）/1.2（测试）共享，属单任务内。
- `skills/systematic-debugging/find-polluter.sh` — Task 3 内 3.1/3.2 共享，属单任务内。

`Pre-flight: no cross-task shared interfaces`。

## Rulings

- Task 1: Ruling: `skills/executing-plans/scripts/task-done` 存在 bash 语法错误（第 34 行 `$'\'$a\'"`），无法运行，故不使用该脚本、改用本文件手动 ledger；该脚本修复转入变更 `absorb-v6.4-skills`。成本：ledger 由手工维护，遗漏风险略升。

## Log

- Task 1: complete — `hooks/hooks.json` 加 `shell:"bash"`，`tests/hooks/test-session-start.sh` 新增断言；RED→GREEN，测试 STATUS: PASSED。
- Task 2: complete — `finishing-a-development-branch` Step 3 提前捕获 `WORKTREE_PATH`、Step 7 复用并新增 removal-refused 询问；`test-worktree-path-policy.sh` PASSED。
- Task 3: complete — `find-polluter.sh` 修复 `./` 前缀与 `**/` 折叠；新增 `tests/systematic-debugging/test-find-polluter.sh` 并登记 platform；RED(4 失败)→GREEN(全通过)。
- Task 4: complete — `npm run test:core` 106/106；`npm run test:platform` 全通过；`verify delivery` 通过（15/15，100%）。
- 变更 A 交付完成：`check delivery` 通过，`delivery-report.md` 已生成。

