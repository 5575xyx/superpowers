# Delta Spec for {{DOMAIN}}

> 模板来源：PowersNexus OpenSpec
> 路径：`.novaway/powersnexus/changes/<name>/delta-specs/<domain>/spec.md`
> 用途：记录相对于主规格的增量变更（ADDED/MODIFIED/REMOVED）

---

## ADDED Requirements

### Requirement: {{REQUIREMENT_NAME}}

**优先级：** P0（必须）/ P1（重要）/ P2（可选）
**需求ID：** REQ-{{ID}}-{{DOMAIN}}

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
  requirements:
    added_count: {{N}}
    modified_count: {{N}}
    removed_count: {{N}}
```

---

**模板使用说明：**
- `{{DOMAIN}}` - 领域/模块名称（如 auth、billing、user-management）
- `{{CHANGE_NAME}}` - 变更名称
- RFC 2119 关键词：**MUST/SHALL** = 绝对需求，**SHOULD** = 推荐需求，**MAY** = 可选需求
- 每个 ADDED/MODIFIED 需求必须包含至少一个验收标准和测试场景
- 优先级定义：P0 = 发布阻塞，P1 = 重要但不阻塞，P2 = 优化/增强