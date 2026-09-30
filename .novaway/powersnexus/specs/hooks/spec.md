# Master Specification: hooks

> 路径：.novaway/powersnexus/specs/hooks/spec.md
> 用途：项目主规格（单一事实来源）
> 版本：v1.1
> 状态：Active
> 创建模式：Greenfield（首次创建）
> 来源变更：session-start-update-notice

---

## Metadata

| 字段 | 内容 |
|------|------|
| **模块名称** | hooks |
| **规格版本** | v1.1 |
| **创建日期** | 2026-09-23 |
| **最后更新** | 2026-09-30 |
| **负责团队** | AI Agent + Human Partner |
| **变更历史** | 见 §6 |

---

## 1. 模块概述

本规格由变更 `session-start-update-notice` 的 Delta Spec 自动创建，覆盖模块 `hooks` 在本次变更中新增的需求。

本次识别的需求：REQ-001, REQ-002, REQ-003, REQ-004, REQ-005。

---

## 2. 功能规格

### 2.2 详细需求

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

---

#### REQ-001: SessionStart 声明 shell: bash

**状态:** 已提议

**陈述：** `hooks/hooks.json` 的 SessionStart 命令对象须声明 `"shell": "bash"`，使支持该键的 harness（Claude Code ≥ 2.1.81）把命令交给 Git for Windows 的 Bash 执行；不支持该键的旧版本忽略之，行为不变。

**验收：**

- `hooks/hooks.json` 中 SessionStart 命令对象含 `"shell": "bash"`。
- `tests/hooks/test-session-start.sh` 新增断言：读取 `hooks/hooks.json`，验证 SessionStart 命令 `type == "command"` 且 `shell == "bash"`。
- Windows 下（路径含 `(` 等元字符）钩子不再静默失效；缺 Git Bash 时给出可操作安装提示。
- 既有三平台 JSON 协议分支与版本比对逻辑不受影响，`tests/hooks/test-session-start.sh` 其余断言通过。

---

**文档版本：** v1.1
---

## 3. 非功能性需求

本次 Delta Spec 未显式定义额外的非功能性需求；后续变更如有性能、可用性或运行环境约束，应以新的 Delta Spec 更新本主规格。

---

## 4. 架构设计

架构决策以变更目录 `.novaway/powersnexus/changes/session-start-update-notice/design.md` 为准。归档过程保留该来源引用，不复制或推测未在 Delta Spec 中声明的设计细节。

---

## 5. 数据模型

本次 Delta Spec 未声明独立的数据模型变更。

---

## 6. 变更历史

| 版本 | 日期 | 变更类型 | 变更说明 | 关联变更 |
|------|------|----------|----------|----------|
| v1.0 | 2026-09-23 | INITIAL | 首次创建 | hooks |

| v1.1 | 2026-09-30 | ADDED | ADDED REQ-001 | absorb-v6.4-behavior-fixes |
---

## 7. 术语表

| 术语 | 定义 |
|------|------|
| Delta Spec | 记录本次变更新增或调整需求的规格文件 |

---

**文档版本：** v1.0
**创建日期：** 2026-09-23
**最后更新：** 2026-09-30
