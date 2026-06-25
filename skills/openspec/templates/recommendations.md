# Recommendations - {{EXPLORATION_NAME}}

> 模板来源：PowersNexus OpenSpec
> 路径：`.novaway/powersnexus/explorations/<name>/recommendations.md`
> 用途：基于探索发现，给出下一步行动建议

---

## 决策摘要

| 项目 | 内容 |
|------|------|
| **探索名称** | {{EXPLORATION_NAME}} |
| **决策类型** | 继续 / 放弃 / 更多探索 / 转向 |
| **推荐方案** | {{RECOMMENDED_APPROACH}} |
| **置信度** | 高 / 中 / 低 |
| **决策专家** | Decision Expert v1.0 |

---

## 选项分析

### 选项 A：继续推进（推荐）

**描述：**
基于探索结果，正式开始该功能的开发

**优势：**
- ✅ {{ADVANTAGE_1}}
- ✅ {{ADVANTAGE_2}}
- ✅ {{ADVANTAGE_3}}

**风险：**
- ⚠️ {{RISK_1}}
- ⚠️ {{RISK_2}}

**缓解措施：**
- {{MITIGATION_1}}
- {{MITIGATION_2}}

**投入预估：**
- 开发时间：{{ESTIMATE}}
- 资源需求：{{RESOURCES}}
- 复杂度：高/中/低

---

### 选项 B：继续探索

**描述：**
当前信息不足，需要进行下一轮探索

**探索重点：**
- [ ] {{NEXT_EXPLORATION_1}}
- [ ] {{NEXT_EXPLORATION_2}}
- [ ] {{NEXT_EXPLORATION_3}}

**为什么需要更多探索：**
- {{REASON_1}}
- {{REASON_2}}

**预计时间：** {{TIMEBOX}}

**下一轮的成功标准：**
- [ ] {{SUCCESS_CRITERION_1}}
- [ ] {{SUCCESS_CRITERION_2}}

---

### 选项 C：放弃此方案

**描述：**
该方案不可行或性价比太低，建议放弃

**放弃原因：**
- ❌ {{REASON_1}}
- ❌ {{REASON_2}}
- ❌ {{REASON_3}}

**替代方案建议：**
- {{ALTERNATIVE_1}}
- {{ALTERNATIVE_2}}

---

### 选项 D：转向其他方案

**描述：**
当前方案不行，但有其他可行方向

**转向方案：** {{PIVOT_DIRECTION}}

**为什么转向：**
- {{REASON_1}}
- {{REASON_2}}

**新方案的优势：**
- ✅ {{ADVANTAGE_1}}
- ✅ {{ADVANTAGE_2}}

**需要做的准备：**
- {{PREP_1}}
- {{PREP_2}}

---

## 决策专家推荐

### 推荐：选项 {{LETTER}} - {{NAME}}

**推荐理由：**
1. {{REASON_1}}
2. {{REASON_2}}
3. {{REASON_3}}

**置信度评估：**

| 因素 | 评分 | 说明 |
|------|------|------|
| 信息充分度 | 高/中/低 | {{EXPLANATION}} |
| 方案清晰度 | 高/中/低 | {{EXPLANATION}} |
| 风险可控性 | 高/中/低 | {{EXPLANATION}} |
| 历史先例 | 高/中/低 | {{EXPLANATION}} |
| **总体置信度** | **高/中/低** | **{{PERCENT}}%** |

**决策层级：** L{{LEVEL}} - {{DESCRIPTION}}
- 如果置信度 > 90%：L0 - 自动决策
- 如果置信度 70-90%：L1 - 推荐决策
- 如果置信度 50-70%：L2 - 协商决策
- 如果置信度 < 50%：L3 - 用户决策

---

## 如果继续：实施路线图

### Phase 1：准备
- [ ] 将探索发现转化为正式需求
- [ ] 编写提案文档（proposal.md）
- [ ] 定义成功标准和验收条件

### Phase 2：设计
- [ ] 进入标准 brainstorming 流程
- [ ] 详细技术设计
- [ ] 红队审查

### Phase 3：实施
- [ ] 任务拆解
- [ ] 迭代开发
- [ ] 测试验证

---

## 如果继续探索：下一轮计划

**目标：**
{{NEXT_GOAL}}

**时间盒：** {{TIMEBOX}}

**重点问题：**
1. {{QUESTION_1}}
2. {{QUESTION_2}}
3. {{QUESTION_3}}

**成功标准：**
- [ ] {{CRITERION_1}}
- [ ] {{CRITERION_2}}
- [ ] {{CRITERION_3}}

---

## 风险提示

**无论选择哪个选项，都需要注意：**
- ⚠️ {{RISK_1}}
- ⚠️ {{RISK_2}}
- ⚠️ {{RISK_3}}

---

## 最终建议

> **决策专家建议：选择选项 {{LETTER}}**
>
> **置信度：{{PERCENT}}%（L{{LEVEL}} 级）**
>
> {{ONE_SENTENCE_RECOMMENDATION}}
>
> **下一步行动：**
> {{NEXT_ACTION}}

---

**决策历史：**
| 日期 | 决策点 | 选项 | 结果 |
|------|--------|------|------|
| {{DATE}} | 初始评估 | 选项 A/B/C/D | 推荐 {{LETTER}} |