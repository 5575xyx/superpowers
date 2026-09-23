# 设计：session-start 版本更新提示（方案 B）

## 元信息

| 字段 | 值 |
|------|-----|
| 变更名 | session-start-update-notice |
| 级别 | L2 Fast Path |
| 创建模式 | Brownfield |
| 状态 | 已批准（用户选定方案 B：仅共享 session-start 钩子 + gitee raw 每日缓存） |

## 意图

旧安装无法感知 PowersNexus 新版本。上游无会话内自更新可抄。本变更在共享 SessionStart 钩子中做**轻量版本比对**：发现远程更新时向注入上下文追加一行中文提示；失败时静默，绝不阻塞会话。

## 需求覆盖

| REQ-ID | 设计落点 |
|--------|----------|
| REQ-001 | 组件职责：本地/远程 version 提取与比较 |
| REQ-002 | 提示格式（单行中文）拼入 session_context |
| REQ-003 | 每日缓存 `$HOME/.cache/.../update-check.json` |
| REQ-004 | 错误处理表：一切失败静默、退出 0 |
| REQ-005 | session-start 与 session-start-codex 共用 check-update |

## 范围

### 在范围内

- 新增 `hooks/check-update`：读本地/远程版本、每日缓存、输出提示行（stdout 单行，或空）
- `hooks/session-start` 与 `hooks/session-start-codex` 调用 check-update，把非空输出拼入已转义的 `session_context`
- 新增 `tests/hooks/test-update-notice.sh` 并挂入 `tests/run-platform-tests.sh`
- Fast Path 文档与交付契约

### 不在范围内

- OpenCode 插件 `powersnexus.js` 的 `setup()`（本次不动）
- 任何自动 `git pull` / 静默升级（方案 C 否决）
- 非 gitee 版本源、semver 预发布标签比较
- 改动 SessionStart JSON 协议分支

## 架构与数据流

```
session-start / session-start-codex
  │
  ├─ bash hooks/check-update   （可失败，整体不因它而失败）
  │     ├─ 本地 version ← $PLUGIN_ROOT/package.json
  │     ├─ 缓存命中（当天）→ 用缓存 latest，不联网
  │     └─ 否则 curl gitee raw package.json（--max-time 3）→ 写缓存
  │     └─ 若 latest > local → 打印一行提示；否则打印空
  │
  ├─ 若提示非空 → 追加到 session_context 文本
  └─ 按平台输出 JSON（协议不变）
```

## 组件职责

### `hooks/check-update`（新）

- 输入：环境变量可覆盖 `POWERSNexus_UPDATE_URL`、`POWERSNexus_UPDATE_CACHE`（测试注入用；正式默认见下）
- 本地版本：`$PLUGIN_ROOT/package.json`（脚本相对定位，与 session-start 一致）
- 默认远程：`https://gitee.com/nova-way/powersnexus/raw/main/package.json`
- 默认缓存：`${XDG_CACHE_HOME:-$HOME/.cache}/powersnexus/update-check.json`
- 缓存字段：`{"checkedAt":"YYYY-MM-DD","latest":"X.Y.Z"}`
- 网络：优先 `curl -fsSL --max-time 3`，无 curl 用 `wget -q -T 3 -O -`，都无则静默退出 0
- 版本解析：从 JSON 粗提 `"version"\s*:\s*"([0-9]+\.[0-9]+\.[0-9]+)"`（不依赖 jq/node）
- 比较：仅当远程三段数字 **严格大于** 本地时输出提示；相等/更旧/解析失败 → 无输出
- 提示格式（单行中文，无换行）：
  `[powersnexus] 检测到新版本 X.Y.Z（当前 A.B.C）。更新：重新安装插件或 git pull 后重启会话。`
- 退出码恒为 0；`set -euo pipefail` 下对网络/解析步骤显式容错

### 钩子接入

- 在拼接 `session_context` **之前**调用：
  `update_notice=$("${BASH:-bash}" "${PLUGIN_ROOT}/hooks/check-update" 2>/dev/null || true)`
- `session_context` 末尾在 `</EXTREMELY_IMPORTANT>` 前或后追加 `\n${update_notice}`（仅当非空）；实现时选 **EXTREMELY_IMPORTANT 块之外、JSON 转义之前** 拼入纯文本，再统一 escape
- 两钩子行为一致；不改三平台 JSON 分支逻辑

## 错误处理

| 条件 | 行为 |
|------|------|
| 无网 / 超时 / HTTP 错 | 静默，无提示 |
| 缓存目录不可写 | 跳过写缓存，本次仍可提示（若有结果） |
| 远程/本地 version 缺失或非 x.y.z | 静默 |
| check-update 整体异常 | `|| true`，钩子继续 |
| 远程 ≤ 本地 | 无提示 |

## 测试策略

新增 `tests/hooks/test-update-notice.sh`（风格对齐 `test-session-start.sh`：临时 HOME、pass/fail）：

1. **离线静默**：断网/无效 URL → 钩子退出 0，输出仍为合法 JSON，上下文不含 `检测到新版本`
2. **发现新版本**：注入 `POWERSNexus_UPDATE_URL` 指向本地 fixture（`version` 大于本地）→ 上下文含 `检测到新版本` 与新版本号
3. **版本不更新**：fixture 版本 ≤ 本地 → 无提示
4. **每日缓存**：第一次联网写入缓存后，改 fixture/断网再跑，当日仍用缓存 `latest`（或第二次不发起网络——以缓存文件日期与结果稳定为准）
5. **回归**：`tests/hooks/test-session-start.sh` 全绿；BOM/编码门禁全绿

挂载：`tests/run-platform-tests.sh` 增加一行 `run_test "版本更新提示" bash tests/hooks/test-update-notice.sh`。

## 风险

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| 钩子启动变慢 | 中 | 高 | `--max-time 3`，无 curl 直接跳过 |
| 破坏 JSON 输出协议 | 低 | 高 | 提示只进 context 文本；回归锁定 session-start 测试 |
| 插件目录只读导致缓存失败 | 中 | 低 | 缓存在 `$HOME/.cache`，不写 PLUGIN_ROOT |
| gitee raw 不可达 | 中 | 低 | 静默失败；提示仅增强非关键路径 |
| 测试在 CI 无外网误报 | 中 | 中 | 测试全部用本地 fixture URL，不依赖公网 |

## 验收条件

1. 离线启动会话：钩子行为与现状一致（合法 JSON + bootstrap），无报错
2. 远程版本更高时：注入上下文含单行中文提示
3. 当日第二次会话不再请求网络（缓存命中）
4. `test:update-notice` + 既有 session-start / core / BOM 测试全部通过
5. 不修改 OpenCode 插件与 JSON 协议分支
