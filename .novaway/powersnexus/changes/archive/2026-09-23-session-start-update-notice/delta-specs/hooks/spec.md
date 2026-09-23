# Delta Spec：hooks（session-start-update-notice）

变更模式：Greenfield

## ADDED

### REQ-001: 版本比对

**陈述：** 会话启动时，共享 SessionStart 钩子须比较本地 `package.json` 的 `version` 与默认源 `https://gitee.com/nova-way/powersnexus/raw/main/package.json` 的 `version`。

**验收：** 远程三段数字严格大于本地时视为有更新；相等、更旧、缺失或非 `X.Y.z` 格式视为无更新。

### REQ-002: 更新提示

**陈述：** 有更新时，钩子须在注入的 `additionalContext` / `additional_context` 文本中追加一行简体中文提示，包含新版本号与当前版本号；格式：`[powersnexus] 检测到新版本 X.Y.Z（当前 A.B.C）。更新：重新安装插件或 git pull 后重启会话。`

**验收：** 上下文含「检测到新版本」与新版本号；无更新时不含该字样。

### REQ-003: 每日缓存

**陈述：** 版本检查结果须缓存于 `${XDG_CACHE_HOME:-$HOME/.cache}/powersnexus/update-check.json`（或 `POWERSNexus_UPDATE_CACHE` 覆盖路径），字段 `checkedAt`（`YYYY-MM-DD`）与 `latest`；同一自然日命中缓存时不发起网络请求。

**验收：** 首次成功检查写入缓存后，当日以不可达 URL 再跑仍能得到基于 `latest` 的提示。

### REQ-004: 失败静默

**陈述：** 无网络、超时（≤3s）、HTTP 失败、解析失败、无 curl/wget、缓存不可写时，`hooks/check-update` 须无输出且退出码 0；钩子其余逻辑不受影响。

**验收：** 坏 URL 时 check-update 无输出退出 0；`hooks/session-start` 仍输出合法 JSON。

### REQ-005: 双钩子共用

**陈述：** `hooks/session-start` 与 `hooks/session-start-codex` 须调用同一 `hooks/check-update`，且不得改变既有三平台 JSON 协议分支行为。

**验收：** `tests/hooks/test-session-start.sh` 与 `tests/hooks/test-update-notice.sh` 对两钩子断言均通过。

## REMOVED

无。

## MODIFIED

无既有 hooks 需求被删除或改写（仅扩展注入文本）。
