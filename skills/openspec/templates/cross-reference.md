# Document Cross-Reference Map

> 模板来源：PowersNexus OpenSpec
> 路径：`.novaway/powersnexus/changes/<name>/cross-reference.md`
> 用途：追踪所有文档之间的关联关系，确保可追溯性和一致性

---

## Document Overview

| 文档 | 路径 | 版本 | 状态 |
|------|------|------|------|
| Proposal | `proposal.md` | {{VERSION}} | Draft / Review / Approved |
| Delta Specs | `delta-specs/` | {{VERSION}} | Draft / Review / Approved |
| Design | `design.md` | {{VERSION}} | Draft / Review / Approved |
| Tasks | `tasks.md` | {{VERSION}} | Draft / Review / Approved |

---

## Requirements → Tasks Mapping

| 需求 ID | 需求名称 | 类型 | 对应任务 | 验收标准 |
|---------|----------|------|----------|----------|
| REQ-001 | {{NAME}} | ADDED | Task 1.1, Task 1.2 | AC-001-1, AC-001-2 |
| REQ-002 | {{NAME}} | MODIFIED | Task 2.1 | AC-002-1 |
| REQ-003 | {{NAME}} | REMOVED | N/A (文档删除) | - |

---

## Requirements → Design Mapping

| 需求 ID | 需求名称 | 影响的架构决策 | 受影响的设计章节 |
|---------|----------|----------------|------------------|
| REQ-001 | {{NAME}} | ADR-001, ADR-002 | Section 3, Section 5 |
| REQ-002 | {{NAME}} | ADR-001 | Section 4 |
| REQ-003 | {{NAME}} | - | Section 8.3 |

---

## Tasks → Files Mapping

| 任务 ID | 任务名称 | 创建文件 | 修改文件 | 删除文件 |
|---------|----------|----------|----------|----------|
| Task 1.1 | {{NAME}} | `src/services/a.ts` | - | - |
| Task 1.1 | {{NAME}} | `tests/unit/a.test.ts` | - | - |
| Task 1.2 | {{NAME}} | `src/repositories/b.ts` | `src/app.ts` | - |
| Task 2.1 | {{NAME}} | `src/controllers/c.ts` | - | - |
| Task 3.1 | {{NAME}} | `tests/integration/c.test.ts` | - | - |

---

## Acceptance Criteria → Verification Mapping

| 验收标准 ID | 描述 | 对应需求 | 对应任务 | 验证方法 | 验证状态 |
|-------------|------|----------|----------|----------|----------|
| AC-001-1 | {{DESC}} | REQ-001 | Task 1.1 | 测试通过 | ✅/❌ |
| AC-001-2 | {{DESC}} | REQ-001 | Task 1.2 | 手动测试 | ✅/❌ |
| AC-002-1 | {{DESC}} | REQ-002 | Task 2.1 | 集成测试 | ✅/❌ |

---

## Requirement Implementation Traceability

> 用于追踪需求的代码实现和测试覆盖情况，由 finishing 阶段自动检查

| 需求 ID | 需求描述 | 优先级 | 代码实现位置 | 测试覆盖位置 | 实现状态 | 测试状态 |
|---------|----------|--------|-------------|-------------|----------|----------|
| REQ-001 | {{DESCRIPTION}} | P0/P1/P2 | `src/path/to/file.ts:LINE` | `tests/path/to/file.test.ts:LINE` | ✅/⚠️/❌ | ✅/⚠️/❌ |
| REQ-002 | {{DESCRIPTION}} | P0/P1/P2 | `src/path/to/file.ts:LINE` | `tests/path/to/file.test.ts:LINE` | ✅/⚠️/❌ | ✅/⚠️/❌ |

### Traceability Rules

**代码标注规范：**
```typescript
// REQ-001: 用户登录时返回 JWT token
export function login(username: string, password: string): Promise<AuthResult> {
  // ...
}
```

**测试标注规范：**
```typescript
// REQ-001 - 验证登录成功返回 token
test('login returns jwt token on success', () => {
  // ...
});
```

### Acceptance Criteria for Traceability

- **P0 需求**：必须有 ✅ 代码实现 + ✅ 测试覆盖
- **P1 需求**：必须有 ✅ 代码实现 + 建议有测试
- **未实现的需求**：必须有明确的原因说明

---

## NFR → Tasks Mapping

| NFR | 目标值 | 对应任务 | 验证方法 | 验证状态 |
|-----|--------|----------|----------|----------|
| 性能：API响应时间 | < 100ms | Task 3.1 | 性能测试 | ✅/❌ |
| 安全：数据加密 | AES-256 | Task 1.2 | 安全扫描 | ✅/❌ |
| 可用性 | 99.9% | Task 3.1 | 负载测试 | ✅/❌ |

---

## Consistency Checks

### Design ↔ Specs

- [ ] 每个 Delta Spec 需求都有对应的 Design 实现方案
- [ ] Design 中的每个技术选型都有对应的需求支撑
- [ ] API 设计覆盖所有数据操作需求

### Tasks ↔ Design

- [ ] 每个任务都对应 Design 中的具体章节
- [ ] 文件变更符合 Design 中的文件清单
- [ ] 接口定义与 Design 中的接口一致

### Tasks ↔ Specs

- [ ] 每个 ADDED 需求都有对应的实施任务
- [ ] 每个 MODIFIED 需求都有对应的修改任务
- [ ] 每个验收标准都有对应的验证任务

### Specs ↔ Proposal

- [ ] 每个需求都能追溯到 Proposal 中的范围定义
- [ ] 成功标准与验收标准一致
- [ ] 风险评估与 Design 中的风险缓解措施对应

---

## Change Log

| 日期 | 变更类型 | 变更内容 | 负责人 |
|------|----------|----------|--------|
| {{DATE}} | Created | 初始化交叉引用表 | {{AUTHOR}} |
| {{DATE}} | Updated | 添加任务映射 | {{AUTHOR}} |
| {{DATE}} | Verified | 确认一致性 | {{AUTHOR}} |

---

**使用说明：**
- 在 brainstorming 后创建此文件，初始填充 Proposal 和 Delta Specs 的映射
- 在 writing-plans 后更新此文件，添加 Tasks 的映射
- 在每次实施完成后更新验证状态
- 在 finishing-a-development-branch 前确认所有一致性检查通过