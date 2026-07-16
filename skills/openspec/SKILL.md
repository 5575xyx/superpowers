---
name: openspec
description: "Manages artifact generation, delta specs, and change lifecycle for PowersNexus. Generates proposal, specs, design, and tasks documents in .novaway/powersnexus/changes/ directory."
---

# OpenSpec Integration for PowersNexus

Manage the lifecycle of changes using structured artifacts and delta-based specifications.

## Directory Structure

All OpenSpec artifacts live in `.novaway/powersnexus/`:

```
.novaway/powersnexus/
├── specs/                        # Master specifications (source of truth)
│   └── <domain>/
│       └── spec.md
├── changes/
│   ├── <change-name>/            # Active change
│   │   ├── proposal.md           # Why and what
│   │   ├── design.md             # Technical approach
│   │   ├── tasks.md              # Implementation checklist
│   │   ├── cross-reference.md    # Document relationship tracking
│   │   ├── deviations.md         # Design deviation log
│   │   ├── progress.md           # Progress tracking
│   │   ├── red-team-review.md    # Red team review results (Complete Path)
│   │   └── delta-specs/          # Delta specs (incremental changes)
│   │       └── <domain>/
│   │           └── spec.md
│   └── archive/                  # Completed changes
│       └── YYYY-MM-DD-<name>/
├── knowledge/                    # Project knowledge base
│   ├── lessons-learned.md        # Lessons learned overview
│   ├── best-practices/           # Best practices by domain
│   │   ├── authentication.md
│   │   ├── api-design.md
│   │   ├── database.md
│   │   └── testing.md
│   ├── common-mistakes/          # Common mistakes and pitfalls
│   │   ├── race-conditions.md
│   │   ├── security-gotchas.md
│   │   └── performance-pitfalls.md
│   ├── retrospectives/           # Historical retrospectives
│   │   └── YYYY-MM-DD-<name>.md
│   └── patterns/                 # Reusable patterns
│       ├── crud-api.md
│       ├── realtime-collab.md
│       └── payment-integration.md
└── explorations/                 # Exploration mode artifacts
    └── YYYY-MM-DD-<name>/
        ├── exploration-log.md
        ├── findings.md
        └── recommendations.md
```

## Core Functions

### 1. Initialize OpenSpec

**Check if `.novaway/powersnexus/` exists.** If not, create the directory structure:

```
.novaway/powersnexus/
├── specs/
└── changes/
    └── archive/
```

### 2. Create Change

Create a new change directory with artifact templates:

```
.novaway/powersnexus/changes/<change-name>/
├── proposal.md
├── design.md
├── tasks.md
├── cross-reference.md       # Document relationship tracking
└── delta-specs/
```

**Change naming:** Use kebab-case: `add-dark-mode`, `fix-login-bug`, `refactor-api`.

### 3. Generate Proposal

Create `proposal.md` with:
- **Intent**: What problem are we solving?
- **Scope**: In scope / Out of scope
- **Approach**: High-level technical direction

### 4. Generate Delta Specs

Create `delta-specs/<domain>/spec.md` with delta format:

```markdown
# Delta for <Domain>

## ADDED Requirements

### Requirement: <Name>
The system SHALL <behavior>.

#### Scenario: <Name>
- GIVEN <condition>
- WHEN <action>
- THEN <result>
- AND <additional result>

## MODIFIED Requirements

### Requirement: <Name>
The system SHALL <new behavior>.
(Previously: <old behavior>)

## REMOVED Requirements

### Requirement: <Name>
(Reason for removal)
```

**RFC 2119 keywords:**
- **MUST/SHALL** — absolute requirement
- **SHOULD** — recommended, exceptions exist
- **MAY** — optional

### 5. Generate Design

Create `design.md` with:
- **Technical Approach**: How to implement
- **Architecture Decisions**: Why specific choices
- **Data Flow**: Component interactions
- **File Changes**: List of files to create/modify

### 6. Generate Tasks

Create `tasks.md` with hierarchical checklist:

```markdown
# Tasks

## 1. <Section Name>
- [ ] 1.1 <Task description>
- [ ] 1.2 <Task description>

## 2. <Section Name>
- [ ] 2.1 <Task description>
- [ ] 2.2 <Task description>
```

**Task best practices:**
- Group related tasks under headings
- Use hierarchical numbering (1.1, 1.2, etc.)
- Keep tasks small enough to complete in one session
- Check tasks off as you complete them

### 7. Update Tasks

When a task is completed, update the checkbox from `[ ]` to `[x]`.

### 8. Archive Change

When a change is complete:
1. **Merge Delta Specs**: Apply ADDED/MODIFIED/REMOVED sections from `.novaway/powersnexus/changes/<name>/delta-specs/` to `.novaway/powersnexus/specs/`
2. **Move to Archive**: Move change folder to `.novaway/powersnexus/changes/archive/YYYY-MM-DD-<name>/`
3. **Preserve Context**: All artifacts remain intact for audit trail

**Delta Merge Rules:**
- **ADDED**: Append to the corresponding spec file
- **MODIFIED**: Replace the existing requirement
- **REMOVED**: Delete the requirement from the spec

## Workflow Integration

### Brainstorming → OpenSpec

After design approval in brainstorming:
1. **Module existence check** — For each target module, check if `.novaway/powersnexus/specs/<module>/spec.md` exists. Determine create mode (A/B/C/D).
2. Create change directory in `.novaway/powersnexus/changes/`
3. Generate proposal from brainstorming output (with create mode in Metadata)
4. Generate delta specs based on requirements (with mode field in header)
5. Generate design document
6. Generate tasks checklist
7. **Initialize delivery contract** — Run `powersnexus init delivery <change-name> --profile <application|library>` after the change directory exists; writing-plans replaces its pending argv placeholders with concrete project commands.
8. **Conditional Master Spec Initialization**:
   - **Greenfield (A)**: Create master spec at `.novaway/powersnexus/specs/<module>/spec.md` using `master-spec.md` template
   - **Brownfield (B)**: Skip; master spec will be updated during archive
   - **Mixed (C)**: For each new module, create master spec; for existing modules, skip
9. Transition to writing-plans skill

### Writing Plans → OpenSpec

Read `.novaway/powersnexus/changes/<name>/tasks.md` as the task source.

### Subagent-Driven Development → OpenSpec

After each task completion:
1. Update the checkbox in tasks.md
2. Verify implementation against delta specs

### Finishing a Development Branch → OpenSpec

Before merging:
1. **Read create mode** from `proposal.md` or `delta-specs/<domain>/spec.md`
2. **Mode-specific merge**:
   - **Greenfield (A)**: Initialize master spec from delta-specs ADDED section
   - **Brownfield (B)**: Apply ADDED/MODIFIED/REMOVED to existing master spec
   - **Mixed (C)**: Process each module independently based on its sub-mode
3. Generate `merge-report.md` recording all merge actions
4. Move change to archive

## Templates

Use templates from `skills/openspec/templates/`:
- `proposal.md` — Proposal template
- `master-spec.md` — **Master spec template** (single source of truth, used for Greenfield)
- `spec.md` — Delta spec template (used for incremental changes)
- `design.md` — Design template
- `tasks.md` — Tasks template
- `cross-reference.md` — Document relationship tracking template
- `deviations.md` — Design deviation tracking template
- `merge-report.md` — **Archive merge report template** (records merge actions)

## Create Modes（创建模式）

PowersNexus OpenSpec 支持 4 种创建模式，根据主规格是否存在以及涉及模块数自动识别：

| 模式 | 场景 | 主规格状态 | 处理方式 |
|------|------|------------|----------|
| **Greenfield (A)** | 首次创建模块 | 不存在 | brainstorming 直接创建主规格 + delta-specs（仅 ADDED） |
| **Brownfield (B)** | 后续修改模块 | 已存在 | 只创建 delta-specs（含 ADDED/MODIFIED/REMOVED），归档时合并 |
| **Mixed (C)** | 跨模块混合 | 部分存在 | 按 module 独立走 A 或 B |
| **Multi-Brownfield (D)** | 跨模块修改 | 全部存在 | 同 B，但涉及多个 module |

**模式识别时机：** brainstorming 阶段 Phase 0 的"模块存在性检查"步骤

**模式判定结果记录到：**
- `proposal.md` 的 Metadata 段
- `delta-specs/<domain>/spec.md` 的"变更模式"段
- `cross-reference.md` 的"模块状态表"（Mixed 模式）

## Schema

The default workflow schema:

```yaml
name: spec-driven
artifacts:
  - id: proposal
    generates: proposal.md
    requires: []
  
  - id: delta-specs
    generates: delta-specs/**/*.md
    requires: [proposal]
  
  - id: design
    generates: design.md
    requires: [proposal]
  
  - id: tasks
    generates: tasks.md
    requires: [specs, design]
  
  - id: cross-reference
    generates: cross-reference.md
    requires: [proposal, specs, design, tasks]
```

Dependencies are enablers, not gates. You can create artifacts in any order that makes sense.
