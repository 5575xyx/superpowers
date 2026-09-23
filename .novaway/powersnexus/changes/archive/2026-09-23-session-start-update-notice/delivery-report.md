# 本地交付报告：session-start-update-notice

> 本报告由已通过的 `delivery.json` 生成，便于人工审阅；交付真实性仍以实时运行 `powersnexus check delivery session-start-update-notice` 的结果为准。

## 交付状态

| 字段 | 内容 |
|------|------|
| 变更 | session-start-update-notice |
| Profile | library |
| 本地状态 | 已完成构建、测试、集成与 Profile 必需的运行或制品验证 |
| 验证时间 | 2026-09-23T13:50:17.326Z |
| 平台 | win32 |
| 架构 | x64 |
| Node.js | v22.22.1 |

## 实际验证步骤

| 步骤 | argv | 状态 | 退出码 | 执行时间 |
|------|------|------|--------|----------|
| build | ["bash","hooks/check-update"] | passed | 0 | 2026-09-23T13:50:08.135Z |
| test | ["bash","tests/hooks/test-update-notice.sh"] | passed | 0 | 2026-09-23T13:50:08.944Z |
| integration | ["bash","tests/hooks/test-update-notice.sh"] | passed | 0 | 2026-09-23T13:50:09.747Z |
| package | ["node","--test","tests/package-artifact.test.mjs"] | passed | 0 | 2026-09-23T13:50:17.321Z |

## 证据文件

- `.novaway/powersnexus/changes/session-start-update-notice/delta-specs/hooks/spec.md`
- `hooks/check-update`
- `hooks/session-start`
- `hooks/session-start-codex`
- `package-lock.json`
- `package.json`
- `tests/hooks/test-session-start.sh`
- `tests/hooks/test-update-notice.sh`

## 证据摘要

- 算法：sha256
- SHA-256：`2d81f3878651964bc8bdfeeed1f0cb1b08606c357894b3ede84be9c0b192d247`
