# Master Specification: {{MODULE}}

> 模板来源：PowersNexus OpenSpec
> 路径：`.novaway/powersnexus/specs/{{MODULE}}/spec.md`
> 用途：项目主规格（单一事实来源），由首次创建变更生成或由归档步骤合并而成
> 版本：v{{VERSION}}
> 状态：Active / Deprecated

---

## Metadata

| 字段 | 内容 |
|------|------|
| **模块名称** | {{MODULE}} |
| **规格版本** | v{{VERSION}} |
| **创建日期** | {{CREATION_DATE}} |
| **最后更新** | {{LAST_UPDATE}} |
| **负责团队** | AI Agent + Human Partner |
| **变更历史** | 见 §6 |

---

## 1. 模块概述

### 1.1 功能描述

{{FUNCTIONAL_DESCRIPTION}}

### 1.2 设计目标

1. **{{GOAL_1}}** — {{GOAL_1_DESC}}
2. **{{GOAL_2}}** — {{GOAL_2_DESC}}

### 1.3 适用范围

{{APPLICABILITY}}

---

## 2. 功能规格

> 严格基于 delta-specs 的 ADDED 需求 + 已合并的 MODIFIED/REMOVED 演化而成

### 2.1 核心功能

| 功能 | 描述 | 优先级 | 关联 REQ |
|------|------|--------|----------|
| {{FEATURE_1}} | {{FEATURE_1_DESC}} | P0/P1/P2 | REQ-{{ID}} |

### 2.2 详细需求

#### REQ-{{ID}}: {{REQUIREMENT_NAME}}

**优先级：** P0 / P1 / P2
**需求ID：** REQ-{{ID}}
**当前状态：** Active / Deprecated
**来源变更：** {{SOURCE_CHANGE_ORIGIN}}

**陈述：** The system SHALL {{BEHAVIOR}}.

**理由：** {{RATIONALE}}

**验收标准：**
- [ ] {{AC_1}}
- [ ] {{AC_2}}

**测试场景：**

```gherkin
Scenario: {{SCENARIO_NAME}} - Happy Path
  Given {{PRECONDITION}}
  When {{ACTION}}
  Then {{EXPECTED_RESULT}}
  And {{ADDITIONAL_RESULT}}
```

**依赖关系：**
- 前置需求：REQ-{{DEP_ID}}
- 被依赖需求：REQ-{{DEPENDED_BY_ID}}

**变更记录：**

| 版本 | 日期 | 变更类型 | 来源 |
|------|------|----------|------|
| v{{V}} | {{DATE}} | INITIAL | {{INITIAL_CHANGE}} |
| v{{V+1}} | {{DATE}} | MODIFIED | {{MODIFYING_CHANGE}} |

---

## 3. 非功能性需求

| NFR | 目标值 | 验证方法 | 状态 |
|-----|--------|----------|------|
| {{NFR_1}} | {{TARGET}} | {{METHOD}} | ✅/⚠️/❌ |

---

## 4. 架构设计

### 4.1 总体架构

{{ARCHITECTURE_DIAGRAM}}

### 4.2 核心组件

| 组件 | 职责 | 文件位置 |
|------|------|----------|
| {{COMPONENT}} | {{RESPONSIBILITY}} | {{FILE_PATH}} |

---

## 5. 数据模型

### 5.1 {{ENTITY_NAME}}

```typescript
interface {{EntityName}} {
  id: string;           // UUID v4
  // ...
}
```

---

## 6. 变更历史

| 版本 | 日期 | 变更类型 | 变更说明 | 关联变更 |
|------|------|----------|----------|----------|
| v{{V}} | {{DATE}} | INITIAL | {{INITIAL_DESC}} | {{INITIAL_CHANGE}} |
| v{{V+1}} | {{DATE}} | ADDED/MODIFIED/REMOVED | {{DESC}} | {{CHANGE}} |

---

## 7. 术语表

| 术语 | 定义 |
|------|------|
| {{TERM}} | {{DEFINITION}} |

---

**文档版本：** v{{VERSION}}
**创建日期：** {{CREATION_DATE}}
**最后更新：** {{LAST_UPDATE}}
