# 流程合规声明：session-start-update-notice

## 声明级别

声明级别：L3（按 CLI 推断：实现 165 行 / 15 任务 / 5 需求 / 1 模块，不低于 L3；实际执行深度为 L2 Fast Path 设计契约 + 计划 + 聚焦测试 + 交付验证，未执行完整红队与多阶段 OpenSpec，理由见「跳过步骤及理由」）

## 级别判定依据

- 变更涉及多平台共享钩子（`hooks/session-start`、`hooks/session-start-codex`）+ 新脚本 + 新测试，但属于 bounded 改动（在既有 hooks 结构内扩展，未新建架构）
- 无 UI 工作、无数据迁移、无外部 API 集成
- 用户在设计阶段明确选定方案 B（会话启动提示）与范围（仅共享钩子 + gitee raw 每日缓存），设计一次批准
- 按 L2 Fast Path 执行：设计契约（design.md）+ 计划（tasks.md）+ 实现 + 聚焦测试 + 交付验证

## 遵循步骤

| 步骤 | 状态 | 说明 |
|------|------|------|
| 任务规模评估（L2） | ✅ | 规模：多文件但 bounded；推断升级 L3 的依据（模块 1、任务 15）未触发完整 L3 条件 |
| brainstorming（L1+ 先行） | ✅ | 关键澄清 2 题（范围、版本源）+ 设计批准 1 题，经 question 工具 |
| 设计契约 | ✅ | `design.md`，含架构/错误处理/风险/验收 |
| OpenSpec 工件 | ✅ | `proposal.md`、`delta-specs/hooks/spec.md`、`tasks.md`、`cross-reference.md` |
| 一致性检查 | ✅ | `check consistency` 5 个 REQ 全映射通过 |
| 交付契约 | ✅ | `init delivery`（library profile）+ `delivery.json` 真实 argv |
| 计划 | ✅ | `writing-plans` 产物，bite-sized 任务 |
| TDD | ✅ | 先写失败测试（`test-update-notice.sh` 7 项红）再实现 `check-update`/钩子接入（绿） |
| 实现 | ✅ | Task 1-5 完成 |
| 验证 | ✅ | 见下方证据 |
| 交付验证 | ✅ | `verify delivery` + `check delivery` 通过，生成 `delivery-report.md` |
| 归档 | ⏸️ | 待用户决定 |

## 跳过步骤及理由

| 步骤 | 理由 |
|------|------|
| L3 完整红队（4 角色并行） | Fast Path 不要求；风险矩阵评估后无高风险项（网络超时/只读目录/JSON 协议破坏均已有缓解） |
| 独立 code-red-team-review.md | 变更规模小（3 个钩子文件 + 测试），风险有限，且已有完整的交付验证与 BOM/编码门禁覆盖 |
| OpenCode 插件 setup 接入 | 设计范围明确排除（用户选定"仅共享 session-start 钩子"） |
| 自动 git pull | 方案 C 已否决 |
| 提交/推送 | 未经授权不执行；本变更工件与实现待用户决定提交策略 |

## 审查记录

- **设计审查**：用户批准设计方案（question 工具选项"批准，继续"）
- **代码自审**：实现后逐条对照 design.md 验收条件 1-5 验证；回归 `tests/hooks/test-session-start.sh` 7/7 通过
- **交付证据**：`delivery-report.md`（verify delivery 生成）

## 验证证据

- `bash tests/hooks/test-update-notice.sh`：7/7 PASS（Git Bash）
- `bash tests/hooks/test-session-start.sh`：7/7 PASS（Git Bash）
- `npm run test:core`：106/106 PASS
- `npm run test:package`：1/1 PASS
- `powersnexus check consistency session-start-update-notice`：通过（5 REQ 全映射）
- `powersnexus verify delivery session-start-update-notice`：通过（生成 delivery-report.md）
- BOM 扫描：`hooks/check-update`、`tests/hooks/test-update-notice.sh` 无 UTF-8 BOM
