# 回顾：session-start-update-notice

**日期：** 2026-09-23
**耗时：** 约 1.5 小时
**团队：** AI Agent + 用户（NovaWay）

## 做得好的

- TDD 严格执行：先写 7 项失败测试，再实现 `hooks/check-update` 与钩子接入
- 每日缓存 + 失败静默设计，钩子路径零运行时依赖（无 jq/node）
- 一致性检查、审计、交付验证、归档全链路通过；hooks 主规格以 Greenfield 创建
- 测试使用本地 `file://` fixture，不依赖公网，CI 可复现

## 可改进的

- 平台测试套件在 Windows 上经 Git Bash 跑全绿；PowerShell 直接调用 `bash` 时 WSL/Git Bash 解析差异会影响个别依赖 `node` 的既有测试（如 test-session-start.sh 在 WSL bash 下报 `node: command not found`），交付验证改用 test-update-notice.sh 规避
- `.gitattributes` 需显式声明无扩展名钩子的 `eol=lf`，否则 autocrlf 可能引入 CRLF 破坏 bash 脚本
- 交付验证中 WSL 环境的 `bash` 解析与 Git Bash 的 PATH 差异，需在 AGENTS.md 中补充说明

## 经验教训

### 技术

- 钩子内版本比较用 `sed` 提取 + 纯 bash 三段数字比较即可，避免引入 node/jq
- `file://` 本地 fixture 是钩子网络测试在离线/CI 环境下最可靠的注入方式（配合 `POWERSNexus_UPDATE_URL` 环境变量）
- 缓存路径必须放 `$HOME` 而非 `PLUGIN_ROOT`（插件安装目录可能只读）
- 无扩展名 shell 脚本须在 `.gitattributes` 显式声明 `text eol=lf`

### 流程

- L2 设计 + TDD + 交付契约链路顺畅；审计推断级别（L3）高于实际执行深度（L2），通过 process-declaration.md 说明差异即可
- Greenfield 模块首次进入规格追踪时，proposal/delta-specs 的「创建模式」须与实际主规格状态一致（本次 hooks 无主规格，应从 Brownfield 修正为 Greenfield）

## 知识更新

- 建议补充 `.gitattributes` 无扩展名钩子 LF 规则（已在本变更落地）
- 建议 AGENTS.md 记录 Windows 上 WSL bash vs Git Bash 的交付验证差异
