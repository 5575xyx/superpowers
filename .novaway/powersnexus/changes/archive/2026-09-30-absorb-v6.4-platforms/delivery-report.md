# 本地交付报告：absorb-v6.4-platforms

> 本报告由已通过的 `delivery.json` 生成，便于人工审阅；交付真实性仍以实时运行 `powersnexus check delivery absorb-v6.4-platforms` 的结果为准。

## 交付状态

| 字段 | 内容 |
|------|------|
| 变更 | absorb-v6.4-platforms |
| Profile | library |
| 本地状态 | 已完成构建、测试、集成与 Profile 必需的运行或制品验证 |
| 验证时间 | 2026-09-30T10:58:00.297Z |
| 平台 | win32 |
| 架构 | x64 |
| Node.js | v22.22.1 |

## 实际验证步骤

| 步骤 | argv | 状态 | 退出码 | 执行时间 |
|------|------|------|--------|----------|
| build | ["node","-e","JSON.parse(require('fs').readFileSync('.muse-plugin/plugin.json','utf8'))"] | passed | 0 | 2026-09-30T10:57:48.426Z |
| test | ["node","tests/run-tests.mjs"] | passed | 0 | 2026-09-30T10:57:56.171Z |
| integration | ["node","--test","tests/package-artifact.test.mjs"] | passed | 0 | 2026-09-30T10:57:58.207Z |
| package | ["node","--test","tests/package-artifact.test.mjs"] | passed | 0 | 2026-09-30T10:58:00.291Z |

## 证据文件

- `.devin-plugin/plugin.json`
- `.hermes-plugin/__init__.py`
- `.muse-plugin/plugin.json`
- `.novaway/powersnexus/changes/absorb-v6.4-platforms/delta-specs/plugins/spec.md`
- `.version-bump.json`
- `package-lock.json`
- `package.json`
- `tests/devin/test-devin-plugin.sh`
- `tests/hermes/test_plugin.py`
- `tests/version-bump/test-bump-version.sh`
- `tests/version-consistency.test.mjs`

## 证据摘要

- 算法：sha256
- SHA-256：`6504ea66e1f95bf5c6e1945f75363fda0ee26b56174f304ee836d7a3fb93c7d8`
