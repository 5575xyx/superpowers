# Proposal: 吸收上游 v6.4 技能改进

> 路径：`.novaway/powersnexus/changes/absorb-v6.4-skills/proposal.md`
> 用途：落地上游 v6.4 的技能精简、brainstorming 三路径与诊断技能（不涉及版本与平台）

---

## 1. Intent（意图）

### Problem Statement

上游 v6.3/v6.4 对技能做了三项实证改进，本仓库尚未同步：

1. **writing-plans 精简（v6.4.2）**：旧版要求计划写全代码，前沿模型在特定提示下会试图在"写计划"阶段实现整个项目；新版改为"计划只记录决策"（签名 + 测试断言 + spec 值），实测计划耗时降至 1/4、token 降至 1/3。
2. **brainstorming 三路径 router（v6.3.0）**：仪式随任务规模（spike / bounded / architectural）伸缩，小任务跳过双文档仪式。
3. **新技能 diagnosing-superpowers（v6.4.1）**：会话出问题时定位原因并给出 `path:line` 证据。

### Goal

落地上述技能改进并新增诊断技能，保持本仓库品牌、五级流程与既有断言不变。

### Success Criteria

1. `writing-plans` 应用 `What a Step Contains` + `Proportion`，删除 `plan-document-reviewer-prompt.md`；保留 `upstream-absorption` 断言所需文案。
2. `brainstorming` 补全 spike / bounded / architectural 三路径；保留 `progressive-activation`、`frontend-quality` 断言所需中文串。
3. 新增 `skills/diagnosing-superpowers/**`（SKILL.md + 11 prompts + 4 references + 4 templates = 20 文件），通过 `tests/diagnosing-superpowers/test-skill-structure.sh`。
4. 删除 `testing-anti-patterns.md`，同步 `writing-good-tests.md` 为上游版；修正 TDD SKILL.md 内的失效链接。
5. `npm run test:core` 全绿。

### 创建模式

- 目标模块：`skills`（主规格由 absorb-v6.4-behavior-fixes 归档后创建）
- 模式：**Brownfield（B）** — 归档时把 delta 追加进 `specs/skills/spec.md`

---

## 2. Scope（范围）

| REQ | 交付物 | 上游依据 |
|-----|--------|----------|
| REQ-001 | `writing-plans` 精简 + 删 reviewer-prompt | v6.4.2 |
| REQ-002 | `brainstorming` 三路径 router | v6.3.0 |
| REQ-003 | 新增 `diagnosing-superpowers` | v6.4.1 |
| REQ-004 | TDD 参考文档更替 | v6.2.0 |

### 明确不做

- 不 bump 版本、不动平台清单（属 `absorb-v6.4-platforms`）。
- 不吸收 hooks/finishing/find-polluter（属 `absorb-v6.4-behavior-fixes`）。
- 不整体中文化技能正文（沿用各文件现有语言惯例）。
- 不吸收未纳入范围的测试（见排除表）。

### 排除表

| 上游测试 | 对应功能 | 理由 |
|----------|----------|------|
| `tests/codex/*` | Codex 打包/市场 | 不属本变更范围 |
| `tests/writing-skills/test-render-graphs.sh` | render-graphs 改动 | 依赖 Graphviz，不属本次交付 |
| `tests/pi/test-pi-extension.mjs` | pi 扩展 | 未纳入 pi harness |

---

## 3. Approach（方法）

`diagnosing-superpowers` 整目录移植（照搬英文，品牌本地化）；`writing-plans`/`brainstorming`/`test-driven-development` 逐项应用增量，逐一比对既有 core 断言所需文案后保留。

关键保护清单（改动时必须保留）：

- `brainstorming/SKILL.md`：`L0 的机械性改动不调用本技能`、`## Checklist（仅 L2+）`、`L1 已按“渐进执行规则”...`、`## Process Flow（L2+）`、`powersnexus init delivery <change-name> --profile`、`ui-ux-pro-max`、`frontend-quality`。
- `writing-plans/SKILL.md`：`**Spec:**`、`## Review Focus`、`powersnexus verify delivery <change-name>`、`approved visual contract`、`Please review the plan`、`Subagent-driven`、`Native`。

---

## 4. 变更清单核对

- [ ] REQ-001 writing-plans 精简
- [ ] REQ-002 brainstorming 三路径
- [ ] REQ-003 diagnosing-superpowers
- [ ] REQ-004 TDD 文档更替
- [ ] `npm run test:core` 全绿

---

**文档版本：** v1.0
**创建日期：** 2026-09-30
