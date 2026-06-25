---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing a Development Branch

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Archive OpenSpec → Detect environment → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## The Process

### Step 1: Verify Tests

**Before presenting options, verify tests pass:**

```bash
# Run project's test suite
npm test / cargo test / pytest / go test ./...
```

**If tests fail:**
```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Stop. Don't proceed to Step 2.

**If tests pass:** Continue to Step 1.5.

### Step 1.5: Verify Acceptance Criteria (Integration Tests)

**Run integration/end-to-end tests to verify acceptance criteria:**

```bash
# Run integration tests
npm run test:integration / pytest --integration / go test ./... -run Integration
```

**Check acceptance criteria from the plan:**
- Read `.novaway/powersnexus/changes/<name>/tasks.md` for acceptance criteria
- Verify each criterion has been met
- Document any gaps or incomplete criteria

**If acceptance criteria not met:**
```
Acceptance criteria not fully met:

[List unmet criteria]

Cannot proceed with merge/PR until all acceptance criteria are verified.
```

Stop. Don't proceed to Step 2.

**If acceptance criteria met:** Continue to Step 1.7.

### Step 1.7: Document Consistency Check

**Automated check for document consistency:**

1. **Cross-reference validation:**
   - Read `.novaway/powersnexus/changes/<name>/cross-reference.md`
   - Verify Requirements ↔ Tasks mapping is complete
   - Verify Tasks ↔ Files mapping reflects actual changes
   - Check for any unimplemented requirements

2. **Design vs. Implementation check:**
   - Compare actual file changes with design document
   - Check for unapproved deviations (read `deviations.md` if exists)
   - Verify all design decisions have been implemented

3. **Generate consistency report:**
   ```markdown
   ## Document Consistency Report

   **Cross-reference Status:**
   - Requirements mapped to tasks: {{N}}/{{TOTAL}}
   - Tasks mapped to files: {{N}}/{{TOTAL}}
   - Unimplemented requirements: [LIST]

   **Design Compliance:**
   - Implemented as designed: {{N}}/{{TOTAL}}
   - Approved deviations: {{N}}
   - Unapproved deviations: {{N}}

   **Overall Status:** [✅ Consistent / ⚠️ Minor gaps / ❌ Inconsistent]
   ```

**If status is ❌ Inconsistent:**
```
Document inconsistency detected:

[List issues]

Cannot proceed with merge/PR until documents are consistent.
```

Stop. Don't proceed to Step 2.

**If status is ✅ Consistent or ⚠️ Minor gaps:** Continue to Step 1.8.

### Step 1.8: Requirement Implementation Traceability Check

**Verify that all requirements have corresponding code and tests:**

1. **Extract all REQ-IDs from delta-specs:**
   - Read all files in `.novaway/powersnexus/changes/<name>/delta-specs/`
   - Collect all requirement IDs (REQ-XXX)
   - Note priority level (P0/P1/P2) for each

2. **Scan codebase for REQ-ID annotations:**
   - Search for `// REQ-XXX:` comments in source code
   - Record file and line number for each match
   - These indicate code implementations

3. **Scan test files for REQ-ID annotations:**
   - Search for `// REQ-XXX -` comments in test files
   - Record file and line number for each match
   - These indicate test coverage

4. **Generate traceability report:**
   ```markdown
   ## Requirement Implementation Traceability Report

   | REQ-ID | Description | Priority | Code Implementation | Test Coverage | Status |
   |--------|-------------|----------|---------------------|---------------|--------|
   | REQ-001 | [desc] | P0 | ✅ src/foo.ts:23 | ✅ tests/foo.test.ts:15 | ✅ Complete |
   | REQ-002 | [desc] | P1 | ✅ src/bar.ts:45 | ❌ Missing | ⚠️ Needs test |
   | REQ-003 | [desc] | P0 | ❌ Missing | ❌ Missing | ❌ Not implemented |

   ### Summary
   - Total requirements: [N]
   - Fully implemented + tested: [N]
   - Implemented but missing tests: [N]
   - Not implemented: [N]
   ```

5. **Apply acceptance rules:**
   - **P0 requirements**: MUST have both code AND tests
   - **P1 requirements**: MUST have code, SHOULD have tests
   - **Unimplemented P0/P1 requirements**: Must have documented reason

**If any P0 requirement is missing code OR tests:**
```
Requirement traceability failed:

[List P0 requirements missing code or tests]

Cannot proceed with merge/PR until all P0 requirements have both implementation and tests.
```

Stop. Don't proceed to Step 2.

**If all P0 requirements have code + tests:** Continue to Step 1.9.

### Step 1.9: Code Red Team Review

**Perform expert code review before finishing:**

**Check which review path to use:**
- **Fast Path**: Skip this step (simple changes, no code review needed)
- **Standard Path**: Code Expert review only
- **Complete Path**: Security Expert + Architect + Code Expert review

**Review Process:**

1. **Identify changed files:**
   - Read git diff or changed files list
   - Focus on: source code, test code, configuration files

2. **Launch code reviewers in parallel:**

   **Standard Path (Code Expert only):**
   - Code Expert: Review code quality, coding standards, maintainability

   **Complete Path (Full Panel):**
   - Security Expert: Review for security vulnerabilities in code (input validation, sensitive data, auth logic)
   - Architect: Review design-to-code consistency, module coupling, error handling
   - Code Expert: Review code quality, coding standards, design patterns

3. **Collect review results:**
   - Save to `.novaway/powersnexus/changes/<name>/code-red-team-review.md`
   - Use the template from `skills/red-team/SKILL.md`

4. **Generate summary:**
   ```markdown
   ## Code Red Team Review Summary

   ### Reviewers
   - ✅ Security Expert (Complete Path only)
   - ✅ Architect (Complete Path only)
   - ✅ Code Expert

   ### Issue Summary
   | Severity | Count | Action Required |
   |----------|-------|-----------------|
   | 🔴 Critical | [N] | Must fix all |
   | 🟠 Important | [N] | Should fix, justify if skipped |
   | 🟡 Minor | [N] | Record only |

   ### Critical Issues (Must Fix)
   [List all critical issues]

   ### Action Required
   - [ ] Fix all critical issues
   - [ ] Review important issues
   - [ ] Re-review after fixes (if any critical issues)
   ```

5. **Apply acceptance rules:**
   - **🔴 Critical issues**: MUST be fixed before proceeding
   - **🟠 Important issues**: SHOULD be fixed, can be skipped with documented justification
   - **🟡 Minor issues**: Record only, don't block

**If any critical issues found:**
```
Code red team review found critical issues:

[List critical issues]

Cannot proceed with merge/PR until all critical issues are fixed.
```

Stop. Don't proceed to Step 2.

**If no critical issues or all fixed:** Continue to Step 2.

### Step 2: Archive OpenSpec Change

**Before presenting options, archive the OpenSpec change with mode-aware merge logic:**

#### 2.1: Read Create Mode

Read the create mode from `proposal.md` Metadata or `delta-specs/<domain>/spec.md` "变更模式" section:

```bash
# From proposal.md Metadata
MODE=$(grep "创建模式" ".novaway/powersnexus/changes/<name>/proposal.md" | head -1)

# Or from delta-specs
MODE=$(grep -A 1 "变更模式" ".novaway/powersnexus/changes/<name>/delta-specs/<domain>/spec.md" | tail -1)
```

Valid modes: `Greenfield` / `Brownfield` / `Mixed` / `Multi-Brownfield`

#### 2.2: Mode-Specific Merge Strategy

**Mode A: Greenfield (首次创建)**

Apply when: `.novaway/powersnexus/specs/<module>/spec.md` does not exist.

1. **Verify precondition**: Specs file MUST NOT exist (otherwise abort and prompt user)
2. **Read delta-specs**: Get the `## ADDED Requirements` section
3. **Generate master spec**: Use `templates/master-spec.md` template structure
4. **Write to**: `.novaway/powersnexus/specs/<module>/spec.md`
5. **Initialize §6 变更历史** with: `v1.0 | <DATE> | INITIAL | <change-name>`
6. **Validate**: MODIFIED/REMOVED sections MUST be empty; abort if found

**Mode B: Brownfield (后续修改)**

Apply when: `.novaway/powersnexus/specs/<module>/spec.md` exists.

1. **ADDED**: Append to spec file with new REQ-IDs (continue from max + 1)
2. **MODIFIED**: Replace existing requirement with same ID; preserve old value in `archive/changelog/`
3. **REMOVED**: Delete requirement from spec; add REMOVED line to §6 变更历史
4. **Bump version**: Increment master spec version number

**Mode C: Mixed (跨模块混合)**

Apply when: Multiple modules, at least one master spec exists, at least one missing.

1. For each module, independently apply Mode A or Mode B based on its existence
2. Generate separate merge report entries for each module

**Mode D: Multi-Brownfield (多模块修改)**

Apply when: Multiple modules, all master specs exist.

1. Apply Mode B logic to each module independently

#### 2.3: Common Operations (All Modes)

After merge completes:
1. **Generate merge report**: Create `merge-report.md` from `templates/merge-report.md`
2. **Save pre-merge snapshot**: Copy existing master specs to `archive/pre-merge-snapshot/`
3. **Move to archive**: `mv .novaway/powersnexus/changes/<name>/ .novaway/powersnexus/changes/archive/YYYY-MM-DD-<name>/`
4. **Preserve context**: All artifacts remain intact for audit trail

#### 2.4: Failure Handling

| Scenario | Action |
|----------|--------|
| Greenfield but specs/ exists | Abort, prompt user: overwrite or rename? |
| Brownfield but specs/ missing | Auto-downgrade to Greenfield, log to `deviations.md` |
| REQ-ID conflict | Abort, prompt user to resolve |
| Module missing in Mixed | Abort, prompt user to verify module list |

**If no OpenSpec change exists:** Skip this step and continue to Step 2.5.

### Step 2.5: Knowledge Base Update & Retrospective

**MANDATORY: This step MUST be completed before finishing. Do NOT skip.**

Capture lessons learned and update the project knowledge base. This is how we improve over time — every change makes the next one better.

1. **Review what was learned:**
   - What went well? (best practices to keep)
   - What went wrong? (mistakes to avoid next time)
   - What was surprising? (unexpected findings)
   - What patterns emerged? (reusable solutions)
   - What was hard? (things to simplify)
   - What took longer than expected? (estimation lessons)

2. **Mandatory knowledge base update:**

   **Always create a retrospective:**
   - Save to `.novaway/powersnexus/knowledge/retrospectives/YYYY-MM-DD-<change-name>.md`
   - This is MANDATORY — do NOT skip

   **If lessons were learned:**
   - Update `lessons-learned.md` with key takeaways
   - Include: description, source, severity, date

   **If common mistakes were made:**
   - Update `knowledge/common-mistakes/*.md` with new entries
   - Include: problem, root cause, solution, prevention

   **If new best practices were discovered:**
   - Update `knowledge/best-practices/*.md` with new entries
   - Include: 适用场景, 具体做法, 代码示例

   **If reusable patterns were created:**
   - Add new pattern document to `knowledge/patterns/`
   - Include: 完整设计, 利弊分析, 使用示例

3. **Update knowledge base index:**
   - Read `.novaway/powersnexus/knowledge/README.md`
   - Add new entries to the index
   - Categorize by type: 经验教训 / 常见错误 / 最佳实践 / 设计模式
   - Include links for easy navigation

4. **Generate retrospective report:**
   - Save to `.novaway/powersnexus/knowledge/retrospectives/YYYY-MM-DD-<change-name>.md`
   - Template structure:

```markdown
# Retrospective: <Change Name>

**Date:** {{DATE}}
**Duration:** {{DURATION}}
**Team:** AI Agent + {{HUMAN_PARTNER}}

## What Went Well
- {{ITEM}}
- {{ITEM}}

## What Could Be Improved
- {{ITEM}}
- {{ITEM}}

## Lessons Learned
### Technical
- {{LESSON}}

### Process
- {{LESSON}}

### Human-AI Collaboration
- {{LESSON}}

## Action Items
- [ ] {{ACTION}} - update knowledge base
- [ ] {{ACTION}} - improve process

## Knowledge Base Updates
- ✅ Added to lessons-learned.md
- ⚠️ Updated common-mistakes/xxx.md
- ✅ Added new pattern: patterns/xxx.md
```

4. **Create knowledge base directory if it doesn't exist:**
   ```
   .novaway/powersnexus/knowledge/
   ├── lessons-learned.md
   ├── best-practices/
   ├── common-mistakes/
   ├── patterns/
   └── retrospectives/
   ```

**Why this matters:**
- Each project makes the next one better
- Avoids repeating the same mistakes
- Builds institutional memory
- Accelerates future development

**If this is the first change (no knowledge base yet):**
- Create the initial knowledge base structure
- Seed with lessons from this project
- Don't worry about being comprehensive — it grows over time

Continue to Step 3.

### Step 3: Detect Environment

**Determine workspace state before presenting options:**

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
```

This determines which menu to show and how cleanup works:

| State | Menu | Cleanup |
|-------|------|---------|
| `GIT_DIR == GIT_COMMON` (normal repo) | Standard 4 options | No worktree to clean up |
| `GIT_DIR != GIT_COMMON`, named branch | Standard 4 options | Provenance-based (see Step 7) |
| `GIT_DIR != GIT_COMMON`, detached HEAD | Reduced 3 options (no merge) | No cleanup (externally managed) |

### Step 4: Determine Base Branch

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or ask: "This branch split from main - is that correct?"

### Step 5: Present Options

**Normal repo and named-branch worktree — present exactly these 4 options:**

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

**Detached HEAD — present exactly these 3 options:**

```
Implementation complete. You're on a detached HEAD (externally managed workspace).

1. Push as new branch and create a Pull Request
2. Keep as-is (I'll handle it later)
3. Discard this work

Which option?
```

**Don't add explanation** - keep options concise.

### Step 6: Execute Choice

#### Option 1: Merge Locally

```bash
# Get main repo root for CWD safety
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"

# Merge first — verify success before removing anything
git checkout <base-branch>
git pull
git merge <feature-branch>

# Verify tests on merged result
<test command>

# Only after merge succeeds: cleanup worktree (Step 7), then delete branch
```

Then: Cleanup worktree (Step 7), then delete branch:

```bash
git branch -d <feature-branch>
```

#### Option 2: Push and Create PR

```bash
# Push branch
git push -u origin <feature-branch>
```

**Do NOT clean up worktree** — user needs it alive to iterate on PR feedback.

#### Option 3: Keep As-Is

Report: "Keeping branch <name>. Worktree preserved at <path>."

**Don't cleanup worktree.**

#### Option 4: Discard

**Confirm first:**
```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' to confirm.
```

Wait for exact confirmation.

If confirmed:
```bash
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"
```

Then: Cleanup worktree (Step 7), then force-delete branch:
```bash
git branch -D <feature-branch>
```

### Step 7: Cleanup Workspace

**Only runs for Options 1 and 4.** Options 2 and 3 always preserve the worktree.

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
WORKTREE_PATH=$(git rev-parse --show-toplevel)
```

**If `GIT_DIR == GIT_COMMON`:** Normal repo, no worktree to clean up. Done.

**If worktree path is under `.worktrees/` or `worktrees/`:** PowersNexus created this worktree — we own cleanup.

```bash
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"
git worktree remove "$WORKTREE_PATH"
git worktree prune  # Self-healing: clean up any stale registrations
```

**Otherwise:** The host environment (harness) owns this workspace. Do NOT remove it. If your platform provides a workspace-exit tool, use it. Otherwise, leave the workspace in place.

## Quick Reference

| Option | Merge | Push | Keep Worktree | Cleanup Branch |
|--------|-------|------|---------------|----------------|
| 1. Merge locally | yes | - | - | yes |
| 2. Create PR | - | yes | yes | - |
| 3. Keep as-is | - | - | yes | - |
| 4. Discard | - | - | - | yes (force) |

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Open-ended questions**
- **Problem:** "What should I do next?" is ambiguous
- **Fix:** Present exactly 4 structured options (or 3 for detached HEAD)

**Cleaning up worktree for Option 2**
- **Problem:** Remove worktree user needs for PR iteration
- **Fix:** Only cleanup for Options 1 and 4

**Deleting branch before removing worktree**
- **Problem:** `git branch -d` fails because worktree still references the branch
- **Fix:** Merge first, remove worktree, then delete branch

**Running git worktree remove from inside the worktree**
- **Problem:** Command fails silently when CWD is inside the worktree being removed
- **Fix:** Always `cd` to main repo root before `git worktree remove`

**Cleaning up harness-owned worktrees**
- **Problem:** Removing a worktree the harness created causes phantom state
- **Fix:** Only clean up worktrees under `.worktrees/` or `worktrees/`

**No confirmation for discard**
- **Problem:** Accidentally delete work
- **Fix:** Require typed "discard" confirmation

## Red Flags

**Never:**
- Proceed with failing tests
- Merge without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request
- Remove a worktree before confirming merge success
- Clean up worktrees you didn't create (provenance check)
- Run `git worktree remove` from inside the worktree

**Always:**
- Verify tests before offering options
- Detect environment before presenting menu
- Present exactly 4 options (or 3 for detached HEAD)
- Get typed confirmation for Option 4
- Clean up worktree for Options 1 & 4 only
- `cd` to main repo root before worktree removal
- Run `git worktree prune` after removal

## Iteration Retrospective

After completing any option (except Discard), conduct a brief retrospective to capture lessons learned:

**What worked well:**
- Which parts of the workflow were smooth?
- Which skills or processes were effective?
- What collaboration patterns worked?

**What could be improved:**
- Where did the process break down?
- What assumptions were wrong?
- What skills or processes need adjustment?

**Action items:**
- [ ] Update skills based on lessons learned
- [ ] Improve documentation or templates
- [ ] Adjust workflow for future iterations

**Record:** Save the retrospective to `.novaway/powersnexus/changes/archive/YYYY-MM-DD-<name>/retrospective.md` for future reference.
