# Design: {{CHANGE_NAME}}

> 模板来源：PowersNexus OpenSpec
> 路径：`.novaway/powersnexus/changes/<name>/design.md`
> 关联提议：`.novaway/powersnexus/changes/<name>/proposal.md`
> 关联规格：`.novaway/powersnexus/changes/<name>/delta-specs/`

---

## 1. Technical Approach

**高层策略：** {{HIGH_LEVEL_STRATEGY}}
> 描述我们选择这个技术方案的核心原因。

**技术选型：**

| 组件 | 选择 | 备选方案 | 决策理由 |
|------|------|----------|----------|
| 语言/框架 | {{CHOICE}} | {{ALTERNATIVE}} | {{REASON}} |
| 数据库 | {{CHOICE}} | {{ALTERNATIVE}} | {{REASON}} |
| 缓存 | {{CHOICE}} | {{ALTERNATIVE}} | {{REASON}} |
| 消息队列 | {{CHOICE}} | {{ALTERNATIVE}} | {{REASON}} |

---

## 2. Architecture Decisions

### ADR-{{NUMBER}}: {{DECISION_TITLE}}

**状态：** Proposed / Accepted / Deprecated

**背景：**
{{CONTEXT}}
> 描述做出这个决策的背景和上下文。

**决策：**
{{DECISION}}
> 描述我们决定采用的方案。

**后果：**
- **正面：** {{POSITIVE_CONSEQUENCES}}
- **负面：** {{NEGATIVE_CONSEQUENCES}}

**相关需求：** REQ-{{ID}}-{{DOMAIN}}

---

## 3. System Architecture

### 3.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │   Web    │  │ Mobile   │  │   API    │                   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                   │
└───────┼─────────────┼─────────────┼───────────────────────────┘
        │             │             │
        └─────────────┴─────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway                              │
│  - Authentication                                           │
│  - Rate Limiting                                           │
│  - Request Routing                                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   Service A   │ │   Service B   │ │   Service C   │
│               │ │               │ │               │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │Primary DB│  │  Cache  │  │  Queue  │                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Component Responsibilities

| 组件 | 职责 | 公开接口 |
|------|------|----------|
| {{COMPONENT}} | {{RESPONSIBILITY}} | {{INTERFACES}} |

---

## 4. Data Model

### 4.1 Entity Relationship

```
┌──────────────────┐       ┌──────────────────┐
│     Entity A     │ 1──N │    Entity B      │
├──────────────────┤       ├──────────────────┤
│ id: UUID         │       │ id: UUID         │
│ name: String     │       │ a_id: UUID (FK)  │
│ created_at       │       │ value: Number     │
│ updated_at       │       │ created_at        │
└──────────────────┘       └──────────────────┘
```

### 4.2 Schema Definitions

**Entity A:**
```typescript
interface EntityA {
  id: string;           // UUID v4
  name: string;         // 1-255 characters
  email?: string;       // Optional, validated format
  createdAt: Date;
  updatedAt: Date;
}
```

**Entity B:**
```typescript
interface EntityB {
  id: string;           // UUID v4
  entityAId: string;    // Foreign key to Entity A
  value: number;        // Decimal(10,2)
  metadata?: Record<string, unknown>;
}
```

---

## 5. API Design

### 5.1 REST Endpoints

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | /api/v1/{{resource}} | List {{resource}} | Query params | Array<{{Resource}}> |
| POST | /api/v1/{{resource}} | Create {{resource}} | {{Resource}}Create | {{Resource}} |
| GET | /api/v1/{{resource}}/:id | Get {{resource}} | - | {{Resource}} |
| PUT | /api/v1/{{resource}}/:id | Update {{resource}} | {{Resource}}Update | {{Resource}} |
| DELETE | /api/v1/{{resource}}/:id | Delete {{resource}} | - | 204 No Content |

### 5.2 Request/Response Examples

**POST /api/v1/{{resource}}**

Request:
```json
{
  "name": "Example Resource",
  "value": 100.00
}
```

Response (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Example Resource",
  "value": 100.00,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 5.3 Error Handling

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 401 | UNAUTHORIZED | Missing or invalid authentication |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource does not exist |
| 409 | CONFLICT | Resource conflict (duplicate) |
| 500 | INTERNAL_ERROR | Server error |

Error Response Format:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      }
    ]
  }
}
```

---

## 6. Data Flow

### 6.1 Request Flow

```
Client → API Gateway → Auth Middleware → Rate Limiter → Controller → Service → Repository → Database
                                                                              ↓
                                                                          Event Bus
                                                                              ↓
                                                                        Notification Service
```

### 6.2 Async Operations

```
User Request → API → Job Queue → Worker → Result Storage → Webhook/Polling
```

---

## 7. Security Design

### 7.1 Authentication & Authorization

- **认证方式：** {{AUTH_METHOD}} (JWT / OAuth2 / Session)
- **Token 过期时间：** {{TOKEN_EXPIRY}}
- **刷新策略：** {{REFRESH_STRATEGY}}

**权限模型：** {{PERMISSION_MODEL}} (RBAC / ABAC / DAC)

| 角色 | 权限 |
|------|------|
| admin | * (所有权限) |
| user | read:own, write:own |
| guest | read:public |

### 7.2 Data Protection

- **传输加密：** TLS 1.3
- **存储加密：** {{STORAGE_ENCRYPTION}}
- **敏感数据：** {{SENSITIVE_FIELDS}} - 使用字段级加密

---

## 8. File Changes

### 8.1 New Files

| 文件路径 | 职责 | 预估行数 |
|----------|------|----------|
| `src/services/{{name}}.ts` | 业务逻辑层 | ~150 |
| `src/repositories/{{name}}.ts` | 数据访问层 | ~100 |
| `src/controllers/{{name}}.ts` | API 控制器 | ~80 |
| `tests/unit/{{name}}.test.ts` | 单元测试 | ~200 |

### 8.2 Modified Files

| 文件路径 | 变更类型 | 变更说明 |
|----------|----------|----------|
| `src/app.ts` | 修改 | 注册新路由 |
| `src/middleware/auth.ts` | 修改 | 添加新权限检查 |
| `db/migrations/{{id}}.sql` | 创建 | 数据库变更 |

### 8.3 Deleted Files

| 文件路径 | 删除原因 |
|----------|----------|
| `src/legacy/{{file}}.ts` | 废弃代码，功能迁移到新模块 |

---

## 9. Risk Assessment

### 9.1 Technical Risks

| 风险 | 可能性 | 影响 | 缓解策略 | 早期预警 |
|------|--------|------|----------|----------|
| 性能瓶颈：{{RISK}} | {{L/M/H}} | {{L/M/H}} | {{MITIGATION}} | {{WARNING}} |

### 9.2 Dependency Risks

| 依赖 | 风险 | 缓解策略 |
|------|------|----------|
| 第三方服务 | 服务中断 | 添加降级方案 |
| 数据库 | 连接池耗尽 | 配置监控和告警 |

---

## 10. Non-Functional Requirements

### 10.1 Performance

| 指标 | 目标 | 测量方法 |
|------|------|----------|
| API 响应时间 P50 | < 100ms | APM 监控 |
| API 响应时间 P99 | < 500ms | APM 监控 |
| 吞吐量 | > 1000 RPS | 负载测试 |

### 10.2 Reliability

| 指标 | 目标 |
|------|------|
| 可用性 | 99.9% |
| 错误率 | < 0.1% |
| MTTR | < 30min |

### 10.3 Security

- 依赖漏洞扫描：每月执行
- 渗透测试：发布前执行
- 安全审计：季度执行

---

## 11. Testing Strategy

### 11.1 Test Pyramid

```
        ┌─────────────┐
        │     E2E     │  ← 5% (关键路径)
       ┌┴─────────────┴┐
       │  Integration   │  ← 20%
      ┌┴───────────────┴┐
      │      Unit       │  ← 75%
```

### 11.2 Coverage Targets

| 类型 | 覆盖率目标 |
|------|-----------|
| 单元测试 | 80% |
| 集成测试 | 覆盖所有 API |
| E2E 测试 | 关键用户流程 |

---

## 12. Deployment Strategy

### 12.1 Rollout Plan

1. **阶段 1（5%）：** 内部用户测试
2. **阶段 2（20%）：** Beta 用户
3. **阶段 3（100%）：** 全量发布

### 12.2 Rollback Plan

- **触发条件：** 错误率 > 1% 或 P99 响应时间 > 2s
- **回滚方法：** `kubectl rollout undo deployment/{{name}}`
- **回滚时间：** < 5 分钟

---

**设计审批：**
- [ ] 架构评审通过
- [ ] 安全评审通过
- [ ] 代码审查通过
- [ ] 测试覆盖达标