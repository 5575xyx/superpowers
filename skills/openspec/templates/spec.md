# Delta Spec for {{DOMAIN}}

> 模板来源：PowersNexus OpenSpec
> 路径：`.novaway/powersnexus/changes/<name>/delta-specs/<domain>/spec.md`
> 用途：记录相对于主规格的增量变更（ADDED/MODIFIED/REMOVED）

---

## 变更模式

> 必填字段；缺少将视为不合格 delta-spec

| 字段 | 内容 |
|------|------|
| **变更模式** | Greenfield / Brownfield / Mixed |
| **主规格状态** | 不存在（Greenfield）/ 已存在 v{{V}}（Brownfield）/ 部分存在（Mixed） |
| **目标模块** | {{MODULE}} |
| **关联主规格路径** | `.novaway/powersnexus/specs/{{MODULE}}/spec.md` |

---

## ADDED Requirements

> **Greenfield 模式（主规格不存在）：** 本段是唯一需要的段；新增 REQ-IDs 从 REQ-001 开始连续编号。
> **Brownfield 模式（主规格存在）：** 新增 REQ-IDs 接续主规格中最大 ID + 1；如主规格中最大 ID 为 REQ-007，则本变更新增从 REQ-008 起。

### Requirement: {{REQUIREMENT_NAME}}

**优先级：** P0（必须）/ P1（重要）/ P2（可选）
**需求ID：** REQ-{{ID}}-{{DOMAIN}}
**来源变更：** {{CHANGE_NAME}}
**当前状态：** Active

**陈述：** The system SHALL {{BEHAVIOR}}.

**理由：** {{RATIONALE}}
> 为什么需要这个需求？它解决什么问题？

**验收标准：**
- [ ] {{AC_1}}
- [ ] {{AC_2}}

**测试场景：**

#### Scenario: {{SCENARIO_NAME}} - Happy Path
```gherkin
Given {{PRECONDITION}}
When {{ACTION}}
Then {{EXPECTED_RESULT}}
And {{ADDITIONAL_RESULT}}
```

#### Scenario: {{SCENARIO_NAME}} - Error Handling
```gherkin
Given {{PRECONDITION}}
When {{ERROR_ACTION}}
Then {{ERROR_RESULT}}
And {{RECOVERY_ACTION}}
```

**依赖关系：**
- 前置需求：REQ-{{DEP_ID}}
- 被依赖需求：REQ-{{DEPENDED_BY_ID}}

---

## MODIFIED Requirements

> **Greenfield 模式：应为空。** 若不慎填写，归档时会中止并报告错误。
> **Brownfield 模式：** 可按需填写，记录相对主规格的修改。

### Requirement: {{REQUIREMENT_NAME}}

**需求ID：** REQ-{{ID}}-{{DOMAIN}}
**优先级：** P0 / P1 / P2

**新陈述：** The system SHALL {{NEW_BEHAVIOR}}.

**旧陈述（参考）：** The system SHALL {{OLD_BEHAVIOR}}.

**变更原因：** {{CHANGE_REASON}}
> 为什么需要修改？需求变更？技术改进？Bug修复？

**影响分析：**
- 受影响的功能：{{AFFECTED_FEATURES}}
- 需要回归测试的区域：{{REGRESSION_AREAS}}

**验收标准：**
- [ ] {{NEW_AC_1}}
- [ ] {{NEW_AC_2}}

---

## REMOVED Requirements

> **Greenfield 模式：应为空。** 若不慎填写，归档时会中止并报告错误。
> **Brownfield 模式：** 可按需填写，记录从主规格中移除的需求。

### Requirement: {{REQUIREMENT_NAME}}

**需求ID：** REQ-{{ID}}-{{DOMAIN}}

**原陈述：** The system SHALL {{OLD_BEHAVIOR}}.

**移除原因：** {{REMOVAL_REASON}}
> 为什么移除？功能废弃？需求变更？合并到其他需求？

**影响分析：**
- 受影响的依赖方：{{AFFECTED_DEPENDENCIES}}
- 迁移计划：{{MIGRATION_PLAN}}

**移除前检查：**
- [ ] 已确认无活跃依赖
- [ ] 已通知相关利益相关者
- [ ] 已备份相关数据（如适用）

---

## Requirements Cross-Reference

| 需求ID | 需求名称 | 类型 | 优先级 | 依赖 |
|--------|----------|------|--------|------|
| REQ-001 | {{NAME}} | ADDED | P0 | - |
| REQ-002 | {{NAME}} | MODIFIED | P1 | REQ-001 |
| REQ-003 | {{NAME}} | REMOVED | - | - |

---

## Schema Validation

```yaml
delta_spec:
  version: "1.0"
  change_name: "{{CHANGE_NAME}}"
  domain: "{{DOMAIN}}"
  mode: "greenfield|brownfield|mixed"  # 必填
  master_spec_exists: true|false       # 必填
  master_spec_path: ".novaway/powersnexus/specs/{{DOMAIN}}/spec.md"
  requirements:
    added_count: {{N}}
    modified_count: {{N}}
    removed_count: {{N}}
  greenfield_initial_version: "v1.0"  # 仅 greenfield 模式填写
```

---

## 模式适配说明

### Greenfield 模式
- 仅填写 `## ADDED Requirements`
- 留空 `## MODIFIED Requirements` 和 `## REMOVED Requirements`
- 归档时：将整个 ADDED 段作为主规格的"初始内容"写入 `.novaway/powersnexus/specs/{{MODULE}}/spec.md`

### Brownfield 模式
- 按需填写 `## ADDED` / `## MODIFIED` / `## REMOVED`
- 归档时：执行标准的 ADD/MODIFY/REMOVE 三段合并

### Mixed 模式
- 多个 module 各自按子模式（A 或 B）独立处理
- 每个 module 一个 delta-spec 文件

---

**模板使用说明：**
- `{{DOMAIN}}` - 领域/模块名称（如 auth、billing、user-management）
- `{{MODULE}}` - 目标模块名（与 DOMAIN 可能相同也可能不同）
- `{{CHANGE_NAME}}` - 变更名称
- **变更模式字段必填** - 缺则视为不合格 delta-spec
- RFC 2119 关键词：**MUST/SHALL** = 绝对需求，**SHOULD** = 推荐需求，**MAY** = 可选需求
- 每个 ADDED/MODIFIED 需求必须包含至少一个验收标准和测试场景
- 优先级定义：P0 = 发布阻塞，P1 = 重要但不阻塞，P2 = 优化/增强