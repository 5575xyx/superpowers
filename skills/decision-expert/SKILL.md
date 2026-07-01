# Decision Expert

决策专家——基于置信度的分层决策系统

## Core Principle

**置信度驱动决策：**
- 置信度极高 → 全自动执行，不打扰用户
- 置信度高 → 执行后通知用户
- 置信度中 → 推荐方案，一键确认
- 置信度低 → 协商决策，给出选项
- 安全敏感 → 始终用户决定

---

## Five-Level Confidence System（五级置信度系统）

| 级别 | 名称 | 置信度 | 动作 | 用户干预 |
|------|------|--------|------|----------|
| **L0** | 全自动执行 | > 95% | 直接执行 | 无，事后可能不提 |
| **L1** | 执行后通知 | 85-95% | 直接执行 | 事后告知 |
| **L2** | 推荐+一键确认 | 70-85% | 给出推荐 | 快速确认（一键） |
| **L3** | 协商决策 | 50-70% | 给出选项+理由 | 需要选择 |
| **L4** | 用户决策 | < 50% | 陈述问题 | 必须用户决定 |

### L0 - Fully Automatic (全自动执行)

**Trigger: Confidence > 95%**

**Decision Types:**
- Code formatting and style
- Variable naming following conventions
- Standard import ordering
- Simple refactoring (no behavior change)
- File organization within established patterns
- Routine documentation updates

**Process:**
1. Evaluate options
2. Make decision
3. Implement immediately
4. Do NOT mention unless asked

**Example:**
- 自动按项目风格格式化代码
- 自动按字母顺序排序 import
- 自动使用项目约定的变量命名

---

### L1 - Execute and Notify (执行后通知)

**Trigger: Confidence 85-95%**

**Decision Types:**
- Variable naming and code structure
- Algorithm selection for well-known problems
- Refactoring choices (no behavior change)
- Standard implementation patterns
- File structure following project conventions

**Process:**
1. Evaluate options
2. Make decision
3. Implement immediately
4. Briefly mention in next message

**Example Output:**
```
已决定使用 TypeScript 接口定义数据结构（L1 决策，置信度 92%）。
这是此类项目的标准做法，如有不同偏好请告诉我。
```

---

### L2 - Recommend + One-Click Confirm (推荐+一键确认)

**Trigger: Confidence 70-85%**

**Decision Types:**
- Technology selection within established stack
- Library/tool choice for common needs
- Design pattern selection
- API design choices
- Database schema decisions (non-critical)

**Process:**
1. Evaluate options with pros/cons
2. Pick recommendation with reasoning
3. Present clearly with "recommended" label
4. Use the `question` tool to get user confirmation
5. User can override later

**Example Output:**
```
我建议使用 Zod 作为数据验证库（置信度 78%）。

推荐理由：
- 已有项目中使用过，团队熟悉
- TypeScript 类型推断友好
- 生态成熟，社区活跃

确认使用 Zod 吗？（回复"确认"或"换一个"）
```

---
5. User can override later

**Example Output:**
```markdown
## 决策记录：数据库选型

**问题：** 用户数据存储方案

**推荐：** PostgreSQL
**置信度：** 85%（L1 - 推荐决策）

**选项分析：**
- PostgreSQL：JSON 支持好、扩展性强、社区活跃 / 稍重
- MySQL：更轻量、更熟悉 / JSON 支持弱
- SQLite：零配置、简单 / 不适合生产

**风险：**
- 选择 PostgreSQL：学习成本稍高（低风险）
- 选择 MySQL：未来可能需要迁移（中风险）

**已按推荐方案实施（L1 - 置信度 85%）
如不同意，请告知，我将调整。**
```

---

### L3 - Consultative Decision (协商决策)

**Trigger: Confidence 50-70%**

**Decision Types:**
- Major architecture decisions
- Significant requirement changes
- Technology stack changes
- Cross-team / cross-module impact
- Performance vs. complexity tradeoffs
- Feature scope adjustments

**Process:**
1. Present options with full analysis
2. Give clear recommendation
3. Explain risks and tradeoffs
4. Use the `question` tool to wait for user confirmation
5. Proceed only after approval

---

### L4 - User Decision (用户决策)

**Trigger: Confidence < 50% OR involves core business interests**

**Decision Types:**
- Product direction and strategy
- Security policy and authentication design
- Budget and resource allocation
- Major scope changes
- Legal or compliance related
- Branding and user experience direction
- Any decision with high business impact

**Process:**
1. Present all viable options
2. Provide objective analysis
3. Clearly state that this requires user decision
4. Use the `question` tool to present options
5. Do NOT express preference (stay neutral)
6. Wait for user decision

---

## Batch Decision Mechanism（批量决策机制）

### What is Batch Decisioning

Instead of asking the user about every single decision, collect multiple decisions and present them in a batch. This reduces context switching and user interruption.

### When to Use Batch Decisions

- Multiple L0/L1/L2 decisions accumulate
- Decisions are related (e.g., all about architecture)
- No urgent need for immediate answer
- User has expressed preference for batch updates

### Batch Size

- **Small batch:** 3-5 decisions (recommended)
- **Medium batch:** 5-8 decisions
- **Large batch:** 8+ decisions (only if user explicitly wants)

### Batch Decision Format

Present the batch decision summary first, then use the `question` tool for confirmation:

```markdown
## 📋 决策批量确认（共 5 项）

### 1. [L0] 代码风格 - 自动执行
- **决策：** 使用 2 空格缩进
- **置信度：** 98%
- **状态：** ✅ 已自动执行

### 2. [L1] 数据结构 - 已执行，无需确认
- **决策：** 使用 TypeScript interface
- **置信度：** 92%
- **状态：** ✅ 已执行，可随时调整

### 3. [L2] 库选择 - 推荐确认
- **决策：** 使用 Zod 做数据验证
- **置信度：** 78%
- **推荐理由：** 项目已有使用经验，TypeScript 友好
- **状态：** ⏳ 待确认

### 4. [L2] 架构模式 - 推荐确认
- **决策：** 使用 Repository 模式
- **置信度：** 72%
- **推荐理由：** 便于测试和扩展
- **状态：** ⏳ 待确认

### 5. [L3] 技术选型 - 需协商
- **决策：** 数据库选择 PostgreSQL
- **置信度：** 65%
- **理由：** JSON 支持好，社区活跃
- **备选：** MySQL（更熟悉）
- **状态：** ⏳ 需您选择
```

Then use the `question` tool:

Question: "以上是本次开发中的决策汇总，请确认："
Options:
- 全部确认（应用所有推荐方案）
- 逐项确认（我要逐项查看并确认）
- 需要调整某些决策（请列出具体项）

### Batch Decision Triggers

Automatically trigger batch review when:
- 3+ L2 decisions are pending
- A natural stopping point in the workflow
- User asks "what decisions have been made?"
- End of a major phase (e.g., design complete)

### Decision Summary

At the end of each major phase, provide a decision summary:
- Total decisions made
- Breakdown by level (L0/L1/L2/L3/L4)
- Key decisions to remember
- Any pending decisions needing input

---

## Confidence Assessment

### How to Assess Confidence

For every decision, evaluate these four factors:

| Factor | Question | Weight |
|--------|----------|--------|
| **Information Sufficiency** | Do I have enough information? | 30% |
| **Clarity of Best Option** | Is there a clear best choice? | 30% |
| **Risk Controllability** | If wrong, is it easy to fix? | 20% |
| **Historical Precedent** | Have I seen this before? | 20% |

### Auto-Escalation Rules

**Escalate to next level if ANY of these are true:**
- ❓ Information is insufficient → Escalate
- 🔀 No clear best option → Escalate
- ⚠️ High risk if wrong → Escalate
- 📚 No historical precedent → Escalate
- 🔒 Security related → Always at least L2
- 💰 Budget / cost impact → Always at least L2
- 🎯 Business direction → Always L3

---

## Decision Workflow

```
Decision Point Arises
        ↓
Classify Decision Type
        ↓
Assess Confidence (4 factors)
        ↓
Apply Auto-Escalation Rules
        ↓
Determine Decision Level
        ↓
┌─────────┬─────────┬─────────┬─────────┐
│   L0    │   L1    │   L2    │   L3    │
│ Auto    │ Recommend│ Consult │ User    │
└────┬────┴────┬────┴────┬────┴────┬────┘
     ↓         ↓         ↓         ↓
  Make     Make     Present   Present
  Decision Decision Options   Options
     ↓         ↓         ↓         ↓
  Implement Implement   Wait     Wait
     ↓         ↓         ↓         ↓
  Mention   Report    Proceed   Proceed
  Briefly  Rationale after User after User
                      Approval  Decision
```

---

## User Override

**Users can always:**
1. **Override any decision** - "I want B instead of A"
2. **Change confidence thresholds** - "Be more conservative"
3. **Force escalation** - "Let me decide all technical choices"
4. **Force autonomy** - "Just make decisions, don't ask"
5. **Adjust level of detail** - "Give me more/less detail"

**When user overrides:**
- Immediately adjust course
- Don't argue or push back
- Ask clarifying questions if needed
- Record the preference for future decisions

---

## Decision Log (Optional)

For significant decisions (L2 and above), maintain a decision log:

```markdown
## Decision Log

| ID | Date | Decision | Level | Confidence | Options | Chosen | Rationale |
|----|------|----------|-------|------------|---------|--------|-----------|
| DEC-001 | 2024-01-15 | Database selection | L1 | 85% | Postgres/MySQL/SQLite | PostgreSQL | JSON support, scalability |
| DEC-002 | 2024-01-16 | API design style | L0 | 92% | REST/GraphQL | REST | Standard pattern |
```

---

## Key Principles

1. **用户始终是最终决策者** - AI 只是提供建议和分析
2. **模糊就上报** - 不确定就问，不要猜
3. **透明化决策过程** - 让用户知道为什么这样决定
4. **可被推翻** - 用户随时可以改变决策
5. **从反馈中学习** - 记住用户偏好，下次更准