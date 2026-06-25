# PowersNexus 质量保障体系 v2.0 - 完整升级方案

> 版本：v2.0
> 日期：2026-06-25
> 核心理念：质量优先，宁重勿滥
> v2.1 增补：OpenSpec 工作流调整（创建模式 + 主规格模板）

---

## 〇、v2.1 增补内容

### OpenSpec 工作流调整（2026-06-25）

**背景：** 在体验完整 v2.0 流程创建 `code-style-checker` 变更时，发现 OpenSpec 工作流存在以下问题：

1. 首次创建模块（Greenfield）场景的语义不清晰
2. delta-specs 模板未区分模式
3. 决策逻辑不清晰
4. 归档逻辑一刀切

**解决方案：** 引入"创建模式"概念，支持 4 种场景：

| 模式 | 场景 | 主规格状态 | 处理方式 |
|------|------|------------|----------|
| **Greenfield (A)** | 首次创建 | 不存在 | 直接创建主规格 + delta-specs（仅 ADDED） |
| **Brownfield (B)** | 后续修改 | 存在 | 只创建 delta-specs，归档时合并 |
| **Mixed (C)** | 跨模块混合 | 部分存在 | 按 module 独立走 A 或 B |
| **Multi-Brownfield (D)** | 多模块修改 | 全部存在 | 同 B，但涉及多个 module |

**新增/修改文件：**

| 文件 | 变更 |
|------|------|
| `skills/openspec/templates/master-spec.md` | **新增** - 主规格模板 |
| `skills/openspec/templates/merge-report.md` | **新增** - 合并报告模板 |
| `skills/openspec/templates/spec.md` | 增加变更模式标识段 |
| `skills/openspec/SKILL.md` | 增加创建模式概念 |
| `skills/brainstorming/SKILL.md` | 增加模块存在性检查 |
| `skills/finishing-a-development-branch/SKILL.md` | 重写 Step 2 归档逻辑 |
| `.novaway/powersnexus/specs/code-style/spec.md` | 迁移到新主规格模板 |

---

## 一、升级概述

### 解决的核心问题

PowersNexus v1.0 存在以下影响输出质量的核心弊端：

1. **审查深度不足** - 单一审查者视角有限，容易遗漏问题
2. **决策干扰过多** - 大小决策都要用户确认，体验差
3. **TDD 形式化** - RED 阶段容易走过场，测试先写但不一定真失败
4. **文档理解偏差** - AI 可能没真正读懂文档就开始写代码
5. **审查不可靠** - 单轮审查容易漏检，质量不稳定
6. **交叉引用纸面化** - 需求-代码-测试的关联只在文档里，没真正验证
7. **不适合探索性工作** - 计划驱动流程对技术调研等不适用
8. **经验无法积累** - 每个项目从零开始，踩过的坑还会再踩

### v2.0 解决方案总览

| 问题 | 解决方案 | 对应模块 |
|------|----------|----------|
| 审查深度不足 | 🔴 红队审查团（4专家并行） | Part 1.1 |
| 决策干扰过多 | 🎯 决策专家（L0-L3分层） | Part 1.2 |
| 二者协同 | 🧠 brainstorming 集成 | Part 1.3 |
| TDD 形式化 | ✅ RED 阶段强制验证 | Part 2.1 |
| 文档理解偏差 | 📚 文档理解度测试 | Part 2.2 |
| 审查不可靠 | 🔍 多轮审查 + 随机抽检 | Part 2.3 |
| 交叉引用纸面化 | 📊 需求实现追踪 | Part 3.1 |
| 不适合探索性工作 | 🔬 探索模式 | Part 3.2 |
| 经验无法积累 | 🧩 项目知识库 | Part 3.3 |

---

## 二、Part 1: 红队审查团 + 决策专家

### 1.1 红队审查团

**核心思路：** 5个专业角色，双阶段并行审查（设计阶段 + 代码阶段）

**5个审查角色：**

| 角色 | 审查重点 | 设计审查 | 代码审查 | 输出 |
|------|----------|----------|----------|------|
| 🔐 **安全专家** | 注入风险、认证授权、数据加密、权限控制、敏感信息泄露 | ✅ | ✅ | 安全审查报告 |
| 🏗️ **架构师** | 可扩展性、耦合度、一致性、性能架构、错误处理架构 | ✅ | ✅ | 架构审查报告 |
| 🧪 **测试专家** | 测试覆盖、边界条件、易测性、测试策略、Mock设计 | ✅ | ❌ | 测试审查报告 |
| ⚡ **性能专家** | 性能瓶颈、资源消耗、缓存策略、数据库查询、并发处理 | ✅ | ❌ | 性能审查报告 |
| 💻 **代码专家** | 代码质量、编码规范、设计模式、代码异味、可维护性 | ❌ | ✅ | 代码审查报告 |

**双阶段审查：**

| 阶段 | 审查对象 | 审查角色 | 输出文件 |
|------|----------|----------|----------|
| **设计审查** | 设计文档 | 安全专家 + 架构师 + 测试专家 + 性能专家 | `red-team-review.md` |
| **代码审查** | 实际代码 | 安全专家 + 架构师 + 代码专家 | `code-red-team-review.md` |

**三级配置：**

| 路径 | 设计审查团 | 代码审查团 | 适用场景 |
|------|-----------|-----------|----------|
| **快速路径** | ❌ 不做 | ❌ 不做 | 简单功能、Bug修复 |
| **标准路径** | 架构师 + 测试专家 | 代码专家 | 中等复杂度功能 |
| **完整路径** | 安全专家 + 架构师 + 测试专家 + 性能专家 | 安全专家 + 架构师 + 代码专家 | 复杂系统、核心功能 |

**文件位置：**
- 技能：`skills/red-team/SKILL.md`
- 设计审查结果：`.novaway/powersnexus/changes/<name>/red-team-review.md`
- 代码审查结果：`.novaway/powersnexus/changes/<name>/code-red-team-review.md`

---

### 1.2 决策专家

**核心思路：** 基于置信度的分层决策，小事AI直接定，大事用户把关

**四级决策体系：**

| 层级 | 决策类型 | 决策者 | 触发条件 | 示例 |
|------|----------|--------|----------|------|
| **L0 - 自动决策** | 技术细节、实现方式 | 决策专家 | 置信度 > 90% | 变量命名、代码结构、算法选择 |
| **L1 - 推荐决策** | 方案选择、技术选型 | 决策专家直接执行，事后告知 | 置信度 70-90% | 数据库选型、框架选择 |
| **L2 - 协商决策** | 架构设计、需求变更 | 决策专家推荐 + 用户确认 | 置信度 50-70% | 系统架构、核心功能 |
| **L3 - 用户决策** | 业务方向、安全敏感、重大变更 | **用户独占** | 置信度 < 50% 或涉及核心利益 | 产品方向、安全策略、预算 |

**模糊决策自动升级：**
- 置信度边界 ±5% 的模糊地带 → 自动升级一级
- 多方案各有优劣 → 列出优劣对比，让用户选
- 涉及安全/合规/成本 → 无论置信度，直接 L3

**文件位置：**
- 技能：`skills/decision-expert/SKILL.md`

---

### 1.3 brainstorming 集成

**Phase 0 项目评估：**
1. 探索项目上下文 + 读取知识库
2. 评估复杂度 → 决策专家推荐路径 → 用户确认
3. 初始化 OpenSpec 目录结构

**Phase 2 质量保障：**
8. 风险评估（标准/完整路径）
9. 设计自审查（标准/完整路径）
10. 🔴 红队并行审查（按路径配置不同团队）
11. 修复关键问题
12. 生成最终方案

**文件位置：**
- 更新：`skills/brainstorming/SKILL.md`

---

## 三、Part 2: TDD 质量保障 + 审查可靠性

### 2.1 RED 阶段强制验证

**核心思路：** 测试必须先真实失败，而且失败原因必须是"功能未实现"

**RED 阶段验证清单（必须全部满足）：**
- ✅ 测试确实运行失败了（不是语法错误，不是配置问题）
- ✅ 失败原因是"功能未实现"（不是测试写错了）
- ✅ 失败输出包含：测试名称、失败断言位置、预期值 vs 实际值、错误堆栈
- ❌ 如果测试直接通过了 → 测试写得不对 → 必须重写

**审查者也要验证：**
- 在 `task-reviewer-prompt.md` 中增加了 RED 阶段验证检查清单
- 审查者必须检查实施者是否真正执行了 RED 阶段
- 必须有失败输出的证据

**文件位置：**
- 模板：`skills/openspec/templates/tasks.md`
- 审查者：`skills/subagent-driven-development/task-reviewer-prompt.md`

---

### 2.2 文档理解度测试

**核心思路：** 实施前先通过5个问题证明你真的读懂了文档

**5个理解测试问题：**

1. **核心需求：** 这个功能/任务的核心需求是什么？用一句话总结。
2. **设计理由：** 为什么选择这个设计方案？关键架构决策有哪些，为什么这么做？
3. **边界情况：** 列出至少3个需要处理的边界情况或异常场景。
4. **验收标准：** 这个任务的验收标准是什么？列出所有关键条件。
5. **依赖关系：** 这个任务依赖哪些模块/服务？会影响哪些模块/服务？

**答错了怎么办？**
- 答错 ≥2 题 → 回去重新读文档，再来答题
- 设计理解偏差 → 重新对齐设计，再开始实施
- 边界情况想太少 → 补充边界情况，再开始实施

**文件位置：**
- 实施者：`skills/subagent-driven-development/implementer-prompt.md`

---

### 2.3 多轮审查 + 质量抽检

**核心思路：** L1自审 → L2专审 → L3随机抽检 → L4关键任务双审

**四级审查体系：**

| 层级 | 审查者 | 范围 | 触发 | 深度 |
|------|--------|------|------|------|
| **L1: 自审** | 实施者 | 所有代码 | 每个任务 | 快速检查 |
| **L2: 专审** | 任务审查者 | 所有代码 | 每个任务 | 标准 |
| **L3: 随机抽检** | 第二审查者 | 15% 的任务 | 随机选择 | 深度 |
| **L4: 强制双审** | 2位审查者 | 关键任务 | P0需求、安全相关 | 全面 |

**抽检算法：**
- 每个任务有 15% 概率被抽中深度审查
- P0 需求 100% L4 双审
- 安全相关代码 100% L4 双审
- 连续3次审查无问题的实施者 → 抽检率降到 5%
- 连续2次审查有严重问题 → 抽检率升到 30%

**文件位置：**
- 更新：`skills/subagent-driven-development/SKILL.md`

---

## 四、Part 3: 需求追踪 + 探索模式 + 知识库

### 3.1 需求实现追踪

**核心思路：** 通过 REQ-ID 把需求、代码、测试真正关联起来，自动验证

**标注规范：**

**代码中标注：**
```typescript
// REQ-001: 用户登录时返回 JWT token
export function login(username: string, password: string): Promise<AuthResult> {
  // ...
}
```

**测试中标注：**
```typescript
// REQ-001 - 验证登录成功返回 token
test('login returns jwt token on success', () => {
  // ...
});
```

**finishing 阶段自动检查：**
1. 从 delta-specs 提取所有 REQ-ID
2. 扫描代码库找 `// REQ-XXX:` 注释
3. 扫描测试文件找 `// REQ-XXX -` 注释
4. 生成追踪报告
5. **P0 需求必须有代码 + 测试，缺一不可**

**文件位置：**
- 模板：`skills/openspec/templates/cross-reference.md`
- 检查：`skills/finishing-a-development-branch/SKILL.md`（Step 1.8）

---

### 3.2 探索模式

**核心思路：** 为技术调研、原型验证等探索性工作设计专用流程，不强制计划驱动

**什么时候用探索模式：**
- 🔬 技术研究 - "这个库适合我们的场景吗？"
- 🧪 原型验证 - "这个方案到底行不行得通？"
- 🐛 Bug 调查 - "这个间歇性故障是什么原因？"
- 🎨 创意设计 - "这个功能怎么做 UX 最好？"
- 🏗️ 架构 Spike - "怎么集成 X 系统？"
- ⚡ 性能测试 - "能扛 10 倍流量吗？"

**探索工作流：**
```
1. 定义探索目标 + 假设
       ↓
2. 设定时间盒（防止无限探索）
       ↓
3. 研究 & 实验（大胆试，快速试）
       ↓
4. 记录发现（成功失败都记录）
       ↓
5. 决策专家评估
       ├─ ✅ 验证成功 → 转标准流程
       ├─ ❌ 验证失败 → 放弃或转向
       └─ ⚠️ 数据不足 → 继续下一轮
```

**产出物：**
- `exploration-log.md` - 探索日志（每天记录）
- `findings.md` - 发现总结
- `recommendations.md` - 建议方案 + 决策专家评估

**文件位置：**
- 技能：`skills/exploration/SKILL.md`
- 模板：`skills/openspec/templates/exploration-log.md`
- 模板：`skills/openspec/templates/findings.md`
- 模板：`skills/openspec/templates/recommendations.md`
- 存放路径：`.novaway/powersnexus/explorations/<name>/`

---

### 3.3 项目知识库

**核心思路：** 每做完一个项目，系统能力就更强一点，经验沉淀下来

**知识库结构：**
```
.novaway/powersnexus/knowledge/
├── lessons-learned.md            # 经验教训总览（索引）
├── best-practices/               # 最佳实践（按领域）
│   ├── authentication.md
│   ├── api-design.md
│   ├── database.md
│   └── testing.md
├── common-mistakes/              # 常见错误和陷阱
│   ├── race-conditions.md
│   ├── security-gotchas.md
│   └── performance-pitfalls.md
├── patterns/                     # 可复用设计模式
│   ├── crud-api.md
│   ├── realtime-collab.md
│   └── payment-integration.md
└── retrospectives/               # 历史复盘
    └── YYYY-MM-DD-<name>.md
```

**各阶段使用方式：**

| 阶段 | 读取 | 写入 |
|------|------|------|
| 🧠 Brainstorming | ✅ 自动读取相关知识 | ⚠️ 发现新模式时建议写入 |
| 💻 开发实施 | ⚠️ 遇到问题时主动检查 | ⚠️ 踩坑时建议记录 |
| ✅ Finishing | ✅ 全面读取对比 | ✅ 自动生成复盘和知识更新建议 |

**持续改进闭环：**
```
项目 → 复盘 → 知识库 → 下个项目更好
  ↑                          |
  └──────────────────────────┘
```

**文件位置：**
- 目录：已更新 `skills/openspec/SKILL.md`
- 模板：`skills/openspec/templates/lessons-learned.md`
- 指南：`skills/openspec/templates/knowledge-base-guide.md`
- 复盘：`skills/finishing-a-development-branch/SKILL.md`（Step 2.5）

---

## 五、目录结构总览

```
.novaway/powersnexus/
├── specs/                            # 主规格
│   └── <domain>/spec.md
│
├── changes/                          # 变更管理
│   ├── <change-name>/
│   │   ├── proposal.md
│   │   ├── design.md
│   │   ├── tasks.md
│   │   ├── cross-reference.md        # 新增：交叉引用 + 需求追踪
│   │   ├── deviations.md
│   │   ├── progress.md
│   │   ├── red-team-review.md        # 新增：红队设计审查结果
│   │   ├── code-red-team-review.md   # 新增：红队代码审查结果
│   │   └── delta-specs/
│   │       └── <domain>/spec.md
│   └── archive/YYYY-MM-DD-<name>/
│
├── knowledge/                        # 新增：项目知识库
│   ├── lessons-learned.md
│   ├── best-practices/
│   ├── common-mistakes/
│   ├── patterns/
│   └── retrospectives/
│
└── explorations/                     # 新增：探索模式
    └── YYYY-MM-DD-<name>/
        ├── exploration-log.md
        ├── findings.md
        └── recommendations.md
```

---

## 六、新增/修改文件清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `skills/red-team/SKILL.md` | 红队审查团技能（5角色 + 双阶段审查） |
| `skills/decision-expert/SKILL.md` | 决策专家技能 |
| `skills/exploration/SKILL.md` | 探索模式技能 |
| `skills/openspec/templates/exploration-log.md` | 探索日志模板 |
| `skills/openspec/templates/findings.md` | 发现总结模板 |
| `skills/openspec/templates/recommendations.md` | 建议方案模板 |
| `skills/openspec/templates/lessons-learned.md` | 经验教训模板 |
| `skills/openspec/templates/knowledge-base-guide.md` | 知识库使用指南 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `skills/brainstorming/SKILL.md` | 集成红队审查 + 决策专家 + 三路径 |
| `skills/openspec/SKILL.md` | 更新目录结构（知识库 + 探索） |
| `skills/openspec/templates/tasks.md` | 强化 RED 阶段验证 |
| `skills/openspec/templates/cross-reference.md` | 添加需求实现追踪表 |
| `skills/subagent-driven-development/task-reviewer-prompt.md` | 添加 RED 阶段验证检查 |
| `skills/subagent-driven-development/implementer-prompt.md` | 添加文档理解度测试 |
| `skills/subagent-driven-development/SKILL.md` | 多轮审查 + 随机抽检机制 |
| `skills/finishing-a-development-branch/SKILL.md` | Step 1.7 文档一致性 + Step 1.8 需求追踪 + Step 1.9 代码红队审查 + Step 2.5 知识库复盘 |

---

## 七、质量保障效果预期

| 维度 | v1.0 | v2.0 | 提升 |
|------|------|------|------|
| 设计缺陷捕获率 | ~60% | ~90% | +30% |
| 安全漏洞遗漏 | 常见 | 罕见 | 大幅降低 |
| TDD 真实执行率 | ~40% | ~95% | +55% |
| 文档理解准确度 | ~70% | ~90% | +20% |
| 审查漏检率 | ~25% | ~8% | -17% |
| 需求遗漏率 | ~15% | ~3% | -12% |
| 用户决策干扰 | 频繁 | 少量关键决策 | 减少 80% |
| 经验复用率 | ~10% | ~60% | +50% |

---

## 八、核心理念重申

> **质量优先，宁重勿滥**
>
> - 流程重一点，但输出质量高，用户体验不会差
> - 复杂项目可以一次跑几小时，那就一次做好做扎实
> - 决策专家模糊决策自动升级用户，不误判
> - 经验持续积累，每个项目都比上一个更好
>
> **PowersNexus v2.0 的目标：**
> 让 AI agent 开发从设计到落地，每个环节的输出都是最稳定、质量最高、效果最好的。