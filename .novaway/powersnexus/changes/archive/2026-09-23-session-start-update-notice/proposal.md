# 提案：session-start-update-notice

## 元信息

| 字段 | 值 |
|------|-----|
| 变更名 | session-start-update-notice |
| 级别 | L2 Fast Path |
| 创建模式 | Greenfield |
| 模块 | hooks / session-start |

## 意图

旧安装在会话启动时无法感知 PowersNexus 新版本；上游无会话内自更新可抄。在共享 SessionStart 钩子中增加轻量版本比对与一行中文提示，失败静默。

## 范围

- **做：** `hooks/check-update`、两钩子接入、`tests/hooks/test-update-notice.sh`、平台套件挂载、一句话文档
- **不做：** OpenCode 插件、自动 git pull、非 gitee 源、改 JSON 协议

## 方法

gitee raw `package.json` 与本地 `version` 比对；`$HOME` 下每日缓存；远程严格大于本地时输出单行提示并入 `session_context`。

## 需求索引

| REQ-ID | 摘要 |
|--------|------|
| REQ-001 | 版本比对 |
| REQ-002 | 更新提示 |
| REQ-003 | 每日缓存 |
| REQ-004 | 失败静默 |
| REQ-005 | 双钩子共用 |

详见 `delta-specs/hooks/spec.md`；映射至 `design.md` 与 `tasks.md`。
