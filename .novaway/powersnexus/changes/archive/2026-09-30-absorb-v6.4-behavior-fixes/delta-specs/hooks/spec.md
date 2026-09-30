# Delta Spec: hooks 模块

> 路径：`.novaway/powersnexus/changes/absorb-v6.4-behavior-fixes/delta-specs/hooks/spec.md`
> 变更模式：Brownfield（ADDED）

---

## ADDED Requirements

### REQ-001: SessionStart 声明 shell: bash

**状态:** 已提议

**陈述：** `hooks/hooks.json` 的 SessionStart 命令对象须声明 `"shell": "bash"`，使支持该键的 harness（Claude Code ≥ 2.1.81）把命令交给 Git for Windows 的 Bash 执行；不支持该键的旧版本忽略之，行为不变。

**验收：**

- `hooks/hooks.json` 中 SessionStart 命令对象含 `"shell": "bash"`。
- `tests/hooks/test-session-start.sh` 新增断言：读取 `hooks/hooks.json`，验证 SessionStart 命令 `type == "command"` 且 `shell == "bash"`。
- Windows 下（路径含 `(` 等元字符）钩子不再静默失效；缺 Git Bash 时给出可操作安装提示。
- 既有三平台 JSON 协议分支与版本比对逻辑不受影响，`tests/hooks/test-session-start.sh` 其余断言通过。

---

**文档版本：** v1.0
