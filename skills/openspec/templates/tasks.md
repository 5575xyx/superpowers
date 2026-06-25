# {{CHANGE_NAME}} Implementation Plan

> 模板来源：PowersNexus OpenSpec
> 路径：`.novaway/powersnexus/changes/<name>/tasks.md`
> 关联设计：`.novaway/powersnexus/changes/<name>/design.md`
> 关联规格：`.novaway/powersnexus/changes/<name>/delta-specs/`

---

**Goal:** {{GOAL}}

**Architecture:** {{ARCHITECTURE}}

**Tech Stack:** {{TECH_STACK}}

**Related Requirements:**
- REQ-{{ID}}-{{DOMAIN}}: {{REQUIREMENT_NAME}}
- REQ-{{ID}}-{{DOMAIN}}: {{REQUIREMENT_NAME}}

---

## Global Constraints

{{GLOBAL_CONSTRAINTS}}

---

## Acceptance Criteria

{{ACCEPTANCE_CRITERIA}}

**验证映射：**
| 验收标准 | 对应任务 | 验证方法 |
|----------|----------|----------|
| {{AC_1}} | Task N.N | {{VERIFY_METHOD}} |
| {{AC_2}} | Task N.N | {{VERIFY_METHOD}} |

---

## Non-Functional Requirements

{{NON_FUNCTIONAL_REQUIREMENTS}}

**NFR 验证：**
| NFR | 目标 | 对应任务 | 验证方法 |
|-----|------|----------|----------|
| {{NFR}} | {{TARGET}} | Task N.N | {{METHOD}} |

---

## File Structure

```
src/
├── services/
│   └── {{name}}.ts       # 业务逻辑层
├── repositories/
│   └── {{name}}.ts       # 数据访问层
├── controllers/
│   └── {{name}}.ts       # API 控制器
├── middleware/
│   └── {{name}}.ts       # 中间件
└── types/
    └── {{name}}.ts       # 类型定义

tests/
├── unit/
│   └── {{name}}.test.ts  # 单元测试
├── integration/
│   └── {{name}}.test.ts  # 集成测试
└── fixtures/
    └── {{name}}.ts       # 测试数据
```

---

## Tasks

### Section 1: {{SECTION_NAME_1}}

**目的：** {{PURPOSE}}
**依赖：** {{DEPENDENCIES}}

---

#### Task 1.1: {{TASK_NAME}}

**关联需求：** REQ-{{ID}}-{{DOMAIN}}
**类型：** 新功能 / 修改 / 重构 / 修复
**预估时间：** {{ESTIMATED_TIME}}

**文件变更：**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts:123-145`
- Test: `tests/exact/path/to/test.ts`

**接口：**
- Consumes: `InterfaceName` from Task 1.2
- Produces: `InterfaceName` for Task 2.1

```typescript
// Type definitions
interface {{InterfaceName}} {
  id: string;
  // ...
}
```

**步骤：**

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/{{name}}.test.ts
describe('{{FeatureName}}', () => {
  it('should {{expected_behavior}}', async () => {
    // Arrange
    const input = {{test_data}};

    // Act
    const result = await {{function}}(input);

    // Assert
    expect(result).toEqual({{expected}});
  });
});
```

Run: `npm test -- --testPathPattern="{{name}}.test.ts" --testNamePattern="should {{expected_behavior}}"`
Expected: FAIL

- [ ] **Step 2: Run test to verify it fails (RED STAGE MANDATORY VERIFICATION)**

```bash
npm test -- --testPathPattern="{{name}}.test.ts" --testNamePattern="should {{expected_behavior}}"
```

**RED 阶段验证清单（必须全部满足）：**
- [ ] 测试确实运行失败了（不是语法错误，不是配置问题）
- [ ] 失败原因是"功能未实现"（不是测试写错了）
- [ ] 失败输出包含：
  - 测试名称
  - 失败断言位置
  - 预期值 vs 实际值
  - 错误堆栈（如有）
- [ ] 如果测试直接通过了 → 测试写得不对 → 必须重写

**失败输出示例：**
```
 FAIL  tests/unit/{{name}}.test.ts
  ● {{FeatureName}} › should {{expected_behavior}}

    expect(received).toEqual(expected)

    Expected: {{expected}}
    Received: {{actual}}

      12 |     // Assert
      13 |     expect(result).toEqual({{expected}});
         |                   ^
      14 |   });
      15 | });

      at Object.<anonymous> (tests/unit/{{name}}.test.ts:13:19)
```

**Expected: FAIL with "{{error_message}}"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/services/{{name}}.ts
export async function {{function}}(input: InputType): Promise<OutputType> {
  // Minimal code to pass the test
  return {{expected_output}};
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern="{{name}}.test.ts" --testNamePattern="should {{expected_behavior}}"
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/unit/{{name}}.test.ts src/services/{{name}}.ts
git commit -m "feat({{domain}}): add {{feature_name}} - implements REQ-{{ID}}"
```

**验证清单：**
- [ ] Test passes
- [ ] No lint errors
- [ ] TypeScript compilation successful
- [ ] Imports are correct

---

#### Task 1.2: {{TASK_NAME}}

**关联需求：** REQ-{{ID}}-{{DOMAIN}}
**类型：** 新功能 / 修改 / 重构 / 修复
**预估时间：** {{ESTIMATED_TIME}}

**文件变更：**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts:123-145`
- Test: `tests/exact/path/to/test.ts`

**接口：**
- Consumes: `InterfaceName` from Task 1.1
- Produces: `InterfaceName` for Task 2.1

**步骤：**

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Section 2: {{SECTION_NAME_2}}

**目的：** {{PURPOSE}}
**依赖：** Section 1 完成

---

#### Task 2.1: {{TASK_NAME}}

**关联需求：** REQ-{{ID}}-{{DOMAIN}}
**类型：** 新功能 / 修改 / 重构 / 修复
**预估时间：** {{ESTIMATED_TIME}}

**文件变更：**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts:123-145`
- Test: `tests/exact/path/to/test.ts`

**接口：**
- Consumes: `InterfaceName` from Task 1.1, Task 1.2
- Produces: `InterfaceName` for Task 3.1

**步骤：**

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Section 3: Integration & Verification

**目的：** 集成所有组件并验证端到端功能

---

#### Task 3.1: {{TASK_NAME}}

**关联需求：** REQ-{{ID}}-{{DOMAIN}}
**类型：** 集成测试
**预估时间：** {{ESTIMATED_TIME}}

**文件变更：**
- Create: `tests/integration/{{name}}.test.ts`

**步骤：**

- [ ] **Step 1: Write integration tests**

```typescript
// tests/integration/{{name}}.test.ts
describe('{{FeatureName}} Integration', () => {
  it('should complete end-to-end flow', async () => {
    // Integration test for the complete feature
  });
});
```

- [ ] **Step 2: Run integration tests**

```bash
npm run test:integration
```
Expected: All tests pass

- [ ] **Step 3: Verify acceptance criteria**

{{ACCEPTANCE_CRITERIA_VERIFICATION}}

- [ ] **Step 4: Commit**

```bash
git add tests/integration/{{name}}.test.ts
git commit -m "test({{domain}}): add integration tests for {{feature_name}}"
```

---

## Final Verification

### Pre-flight Checks

- [ ] All tasks completed
- [ ] All tests passing
- [ ] No lint errors
- [ ] TypeScript compilation successful
- [ ] Code coverage meets target

### Acceptance Criteria Verification

| 验收标准 | 状态 | 验证证据 |
|----------|------|----------|
| {{AC_1}} | ✅/❌ | {{EVIDENCE}} |
| {{AC_2}} | ✅/❌ | {{EVIDENCE}} |

### Non-Functional Requirements Verification

| NFR | 目标 | 实际 | 状态 |
|-----|------|------|------|
| {{NFR}} | {{TARGET}} | {{ACTUAL}} | ✅/❌ |

### Run Full Test Suite

```bash
npm test
npm run test:integration
npm run lint
npm run type-check
```

**Expected:** All checks pass

### Commit Final Changes

```bash
git add -A
git commit -m "feat({{domain}}): complete {{feature_name}} implementation"
```

---

## Progress Ledger

| 任务 | 状态 | 完成时间 | 审查意见 |
|------|------|----------|----------|
| 1.1 | ✅/🔄/❌ | {{DATE}} | {{NOTES}} |
| 1.2 | ✅/🔄/❌ | {{DATE}} | {{NOTES}} |
| 2.1 | ✅/🔄/❌ | {{DATE}} | {{NOTES}} |
| 3.1 | ✅/🔄/❌ | {{DATE}} | {{NOTES}} |

---

## Notes

**遇到的问题：**
- {{ISSUE_1}} → {{RESOLUTION}}

**学到的经验：**
- {{LESSON_1}}

**后续改进：**
- {{IMPROVEMENT_1}}