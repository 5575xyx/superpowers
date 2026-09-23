# 交叉引用：session-start-update-notice

## 模块状态

| 模块 | 状态 |
|------|------|
| hooks | 缺失（Greenfield，归档时创建主规格） |

## 需求 ↔ 文档

| REQ-ID | proposal.md | design.md | tasks.md |
|--------|-------------|-----------|----------|
| REQ-001 | 范围/方法 | 架构与数据流、组件职责 | Task 2 |
| REQ-002 | 方法 | 组件职责提示格式 | Task 1、Task 3 |
| REQ-003 | 方法 | 节流与缓存 | Task 1 用例5、Task 2 |
| REQ-004 | 意图 | 错误处理 | Task 1 用例1、Task 2 |
| REQ-005 | 范围 | 钩子接入 | Task 1、Task 3 |

## 任务 ↔ 文件

| 任务 | 文件 |
|------|------|
| Task 1 | `tests/hooks/test-update-notice.sh`、`tests/run-platform-tests.sh` |
| Task 2 | `hooks/check-update` |
| Task 3 | `hooks/session-start`、`hooks/session-start-codex` |
| Task 4 | `docs/README.opencode.md` 或 `.opencode/INSTALL.md` |
| Task 5 | `delivery.json`、CLI check/verify |

## 验收 ↔ 验证

| AC | 验证 |
|----|------|
| 离线静默 | test-update-notice 用例1、test-session-start |
| 新版本提示 | test-update-notice 用例2/3 |
| 旧版本无提示 | test-update-notice 用例4 |
| 每日缓存 | test-update-notice 用例5 |
| 交付 | check consistency / check delivery / verify delivery |
