# PowersNexus

PowersNexus 是一套完整的编码代理（coding agent）软件开发方法论，基于一组可组合的技能（skills）和初始指令构建而成，确保你的代理能够正确地使用它们。

## 核心特性

- **五级流程体系（L0-L4）**：根据任务规模自动匹配流程，简单任务简单做，复杂任务完整做，效率提升 80%+
- **任务规模自动评估**：6 维度智能评估（代码改动量、影响范围、风险等级等），自动推荐合适的流程级别
- **多平台支持**：兼容 Claude Code、Cursor、OpenCode、Kimi Code、Copilot CLI 等主流编码代理
- **统一文档管理**：所有工作流文档统一存储在 `.novaway/powersnexus/` 目录下
- **增量规格（Delta Specs）**：支持 ADDED/MODIFIED/REMOVED 三种变更类型，适合增量开发和 brownfield 项目
- **自动归档**：开发完成后自动合并 Delta Specs 到主规格，并归档变更记录
- **CLI 自动化工具**：`powersnexus` 命令行工具，提供文档一致性检查、归档合并、流程启动、需求追踪等自动化能力
- **决策专家优化**：五级置信度分层 + 批量决策机制，减少用户决策干扰 60%+
- **专门流程模板**：Bugfix Mode、Config Mode、Doc Mode，覆盖紧急修复、配置修改、文档更新等边界场景
- **内置 ripgrep**：集成 ripgrep 工具，无需额外安装，解决国内网络问题

## 快速开始

为你的编码代理安装 PowersNexus：[OpenCode](#opencode) 

## 工作原理

当你启动编码代理时，PowersNexus 会在第一时间介入。一旦它发现你正在构建某些东西，并不会立即着手写代码，而是会后退一步，先弄清楚你真正想要实现的目标。

在对话中梳理出规格后，它会分小段呈现给你审阅，每段都足够简短、易于消化。

设计获得批准后，代理会制定一份实施计划，清晰到一位热情但缺乏品味、缺乏判断力、不了解项目背景且不情愿测试的初级工程师都能照着执行。计划强调严格的 red/green TDD、YAGNI（你不会需要它）和 DRY 原则。

接下来，一旦你说"开始"，它会启动**subagent-driven-development** 流程，让代理逐项处理每个工程任务、检查并审查它们的工作，然后继续推进。代理通常能够连续自主工作数小时而不偏离你制定好的计划。

还有很多细节，但这就是整个系统的核心。由于技能会自动触发，你无需任何额外操作 —— 你的编码代理已经具备了 PowersNexus 能力。

## 目录结构

所有工作流产生的文档统一存储在项目根目录的 `.novaway/powersnexus/` 目录下：

```
.novaway/
├── powersnexus/
│   ├── specs/                        # 主规格（单一事实来源，完整规格文档）
│   │   └── <domain>/
│   │       └── spec.md
│   └── changes/
│       ├── <change-name>/            # 活动变更
│       │   ├── proposal.md           # 提议文档
│       │   ├── design.md             # 设计文档
│       │   ├── tasks.md              # 任务清单
│       │   ├── progress.md           # 进度记录
│       │   └── delta-specs/          # 增量规格（相对于主规格的变更）
│       │       └── <domain>/
│       │           └── spec.md
│       └── archive/                  # 已完成变更归档
│           └── YYYY-MM-DD-<name>/
└── ...                               # 其他工具的文档
```

### 文档说明

| 文件 | 说明 | 生成时机 |
|------|------|---------|
| `specs/<domain>/spec.md` | 主规格文档，项目的单一事实来源 | 首次设计时创建，后续变更时增量合并 |
| `changes/<name>/proposal.md` | 提议文档，说明意图、范围和方法 | brainstorming 设计批准后 |
| `changes/<name>/design.md` | 设计文档，技术方案和架构决策 | brainstorming 设计批准后 |
| `changes/<name>/tasks.md` | 任务清单，实施步骤和验证方法 | writing-plans 技能生成 |
| `changes/<name>/delta-specs/` | 增量规格，记录 ADDED/MODIFIED/REMOVED | brainstorming 设计批准后 |
| `changes/archive/` | 已完成变更归档，保留完整审计轨迹 | finishing-a-development-branch 技能 |

## 安装方式

不同编码代理的安装方式各不相同。如果你使用多个代理，请分别为每个代理安装 PowersNexus。


手动配置 opencode.json**

在 `opencode.json`（全局或项目级别）中添加：

```json
{
  "plugin": ["powersnexus@git+https://gitee.com/nova-way/powersnexus.git"]
}
```

重启 OpenCode，插件将自动安装并注册所有技能。

验证安装：询问 "告诉我你的 powersnexus 是什么"



## 五级流程体系（L0-L4）

PowersNexus v3.0 采用五级流程体系，根据任务规模自动匹配最合适的流程，不再每次走完完整流程。

| 级别 | 名称 | 适用场景 | 预计耗时 | 核心特点 |
|------|------|----------|----------|----------|
| **L0** | 微型修复 | typo、配置、文案调整 | < 5 分钟 | 直接修改，快速验证 |
| **L1** | 快速迭代 | 小功能、Bug 修复、小优化 | < 30 分钟 | 快速设计 + TDD |
| **L2** | 标准流程 | 中型功能、模块增强 | 1-2 小时 | 完整设计 + 简化审查 |
| **L3** | 完整流程 | 大型功能、架构变更 | 4-8 小时 | 完整设计 + 全量审查 |
| **L4** | 重量级 | 核心架构、重大重构 | 1 天+ | 全流程 + 深度评估 |

**自动评估**：`brainstorming` 技能启动时自动触发 `task-size-assessor`，6 维度智能评估并推荐流程级别。

**专门流程**：
- **Bugfix Mode** — 紧急修复：先解决问题，后补流程文档
- **Config Mode** — 配置修改：极简流程，快速验证
- **Doc Mode** — 文档更新：无需代码测试

## 基本工作流程（标准 L2/L3 路径）

1. **brainstorming**（头脑风暴） — 在写代码前自动激活。通过任务规模评估推荐 L0-L4 级别，提问打磨初步想法、探索替代方案、分段呈现设计以供确认。生成设计文档。
2. **openspec**（OpenSpec 集成） — 设计批准后激活。生成提议（proposal）、增量规格（delta specs）、设计（design）和任务（tasks）文档，统一存储到 `.novaway/powersnexus/changes/<name>/` 目录，并初始化主规格到 `.novaway/powersnexus/specs/`。
3. **using-git-worktrees**（使用 Git Worktree） — 设计批准后激活。在新分支上创建隔离工作区，运行项目设置，验证测试基线干净。
4. **writing-plans**（制定计划） — 设计获批后激活。将工作拆分为 2-5 分钟的可执行任务。每个任务都包含精确的文件路径、完整代码、验证步骤。**内置一致性检查**：自动调用 CLI 工具验证文档完整性。
5. **subagent-driven-development**（子代理驱动开发）或 **executing-plans**（执行计划） — 计划就绪后激活。为每个任务调度全新的子代理，并进行两阶段审查（规格合规性 + 代码质量），或者分批执行并设置人工检查点。
6. **test-driven-development**（测试驱动开发） — 实施过程中激活。强制执行 RED-GREEN-REFACTOR：先写失败测试 → 看着它失败 → 写最小代码 → 看着它通过 → 提交。删除先于测试写出的代码。
7. **requesting-code-review**（请求代码审查） — 任务间激活。对照计划审查，按严重程度报告问题。关键问题会阻塞进度。
8. **finishing-a-development-branch**（完成开发分支） — 任务完成后激活。验证测试、呈现选项（合并/PR/保留/丢弃）、清理 worktree。**优先使用 CLI 工具自动归档**，将 Delta Specs 合并到主规格。**强制更新知识库**，确保经验持续积累。

**代理会在任何任务之前检查相关技能。** 这是强制性的工作流，而非建议。

## 技能库

### 规划与设计

- **brainstorming** — 苏格拉底式设计精炼，自动触发任务规模评估
- **task-size-assessor** — 任务规模评估（6 维度），自动推荐 L0-L4 流程级别
- **openspec** — 管理产物生成、增量规格与变更生命周期，统一管理 `.novaway/powersnexus/` 下的所有文档
- **writing-plans** — 详细的实施计划，内置文档一致性检查
- **decision-expert** — 决策专家，五级置信度分层 + 批量决策机制

### 开发

- **subagent-driven-development** — 通过两阶段审查（规格合规性、代码质量）快速迭代
- **executing-plans** — 带检查点的批量执行
- **dispatching-parallel-agents** — 并发子代理工作流
- **test-driven-development** — RED-GREEN-REFACTOR 循环（包含反模式参考）
- **using-git-worktrees** — 并行开发分支

### 质量与审查

- **requesting-code-review** — 审查前检查清单
- **receiving-code-review** — 响应反馈
- **systematic-debugging** — 4 阶段根因分析流程
- **verification-before-completion** — 确认问题真正解决
- **finishing-a-development-branch** — 合并/PR 决策工作流，CLI 自动归档 + 强制知识库更新

### 元技能

- **writing-skills** — 遵循最佳实践创建新技能（包含测试方法论）
- **using-powersnexus** — 技能系统入门

## CLI 自动化工具

PowersNexus 提供 `powersnexus` 命令行工具，自动化常见操作，提升效率。

### 安装

```bash
# 全局安装
npm link

# 或直接使用
node src/cli/powersnexus-cli.js
```

### 可用命令

| 命令 | 说明 | 触发时机 |
|------|------|----------|
| `powersnexus start "<任务描述>"` | 任务规模评估，推荐 L0-L4 级别 | brainstorming 阶段 |
| `powersnexus check consistency <变更名>` | 文档一致性检查（REQ 映射完整性） | writing-plans 完成后 |
| `powersnexus archive <变更名>` | 自动归档合并（Delta Specs → 主规格） | finishing 阶段 |
| `powersnexus trace <变更名>` | 需求追踪自动生成 | 任意阶段 |

### 自动集成

CLI 工具已深度集成到核心技能中，AI 代理会自动调用：

- **writing-plans** — 完成计划后自动运行 `check consistency`
- **finishing-a-development-branch** — 归档时优先使用 `archive` 命令
- **brainstorming** — 任务评估时可调用 `start` 快速初评

## 设计哲学

- **测试驱动开发** — 始终先写测试
- **系统化优于临时应对** — 流程优于猜测
- **降低复杂度** — 以简洁为首要目标
- **证据优于断言** — 在宣告成功前先验证
