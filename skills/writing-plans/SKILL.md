---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write implementation plans for an engineer who has not seen this codebase or this spec. Assume they write idiomatic code in the project's language once they know the exact interface and the exact test, and that they will make a reasonable choice wherever the plan leaves one open. What they cannot know is what you decided: which files, which names and signatures, which values from the spec, which tests prove each task. Document those. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** If working in an isolated worktree, it should have been created via the `PowersNexus:using-git-worktrees` skill at execution time.

**Save plans to:** `.novaway/powersnexus/changes/<name>/tasks.md`
- (User preferences for plan location override this default)
- Read existing tasks from `.novaway/powersnexus/changes/<name>/tasks.md` if it exists from brainstorming

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Task Right-Sizing

A task is the smallest unit that carries its own test cycle and is worth a
fresh reviewer's gate. When drawing task boundaries: fold setup,
configuration, scaffolding, and documentation steps into the task whose
deliverable needs them; split only where a reviewer could meaningfully
reject one task while approving its neighbor. Each task ends with an
independently testable deliverable.

## Step Granularity

**Each step is one action with a checkable result:**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use PowersNexus:subagent-driven-development (recommended) or PowersNexus:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

**Spec:** [path to the spec/design doc this plan implements — the plan
argues from the spec, so the spec travels with it; executors read both]

## Global Constraints

[The spec's project-wide requirements — version floors, dependency limits,
naming and copy rules, platform requirements — one line each, with exact
values copied verbatim from the spec. Every task's requirements implicitly
include this section.]

## Acceptance Criteria

[End-to-end conditions that must be true for this feature to be considered
complete. These are testable, objective statements. Each should map to a
verification step in the final integration test task.]

## Non-Functional Requirements

[Quality attributes that the implementation must satisfy:

- **Performance:** response time targets, throughput requirements, memory limits
- **Reliability:** error rates, availability targets, retry policies
- **Security:** authentication requirements, data protection, input validation
- **Maintainability:** code quality standards, documentation requirements
- **Observability:** logging, metrics, error reporting requirements

For user-interface work, also include the approved visual contract: design system or token source, responsive breakpoints, component states, accessibility expectations, and desktop/mobile visual acceptance evidence.

Include only what's relevant. Copy exact values from the spec if present.]

## Review Focus

[The five input classes or failure modes the spec implies but no task's
tests exercise that are most likely to bite a person using this software —
one line each, naming the input or condition and the behavior a
reasonable person would expect, most likely first. The spec is a vision
document: it says what the software must do, not everything it will
meet, and its silence on an input is not permission for that input to
break the program. Write the list here, once, with the spec in front of
you. Then, for each line, add the test that pins it to the task that
owns the code, in that task's own step style. An empty section means
you checked and found none, not that you skipped the check.]

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Interfaces:**
- Consumes: [what this task uses from earlier tasks — exact signatures]
- Produces: [what later tasks rely on — exact function names, parameter
  and return types. A task's implementer sees only their own task; this
  block is how they learn the names and types neighboring tasks use.]

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Implement `function(input: InputType) -> ResultType` in `exact/path/to/file.py`**

One line on the approach when the signature and the test leave a choice
(which library call, which data structure); a code block only for an
algorithm they do not determine.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## What a Step Contains

A step is done when the implementer can write exactly one reasonable thing
from it. That is the whole requirement: unambiguous, not complete. Each kind
of step carries what makes it unambiguous and nothing more:

- **A test step:** the test's name and its assertions, as code, with the
  spec's exact values in them.
- **A code step:** the exact signature (name, parameters, return type), the
  file it lives in, and the specific values the spec pins. The implementer
  writes the body. A body appears only for an algorithm the signature and
  tests do not determine, or for exact copy the spec fixes.
- **A verification step:** the command to run and the output that means it
  passed.
- **A reference to another task:** that task's Interfaces block says what
  to use; the plan does not repeat that task's code.

A plan is the set of decisions the implementer cannot make alone. A plan
longer than the code it describes has written the code instead. Lines that
decide nothing ("TBD", "handle edge cases", "add appropriate validation",
"write tests for the above", a type or function no task defines) are the
opposite failure, and the self-review catches both.

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Acceptance criteria coverage:** Does the final integration/verification task cover every acceptance criterion? Each criterion must have a corresponding test or verification step.

**3. Non-functional requirements:** Are NFRs (performance, security, etc.) reflected in the plan? Do any tasks explicitly verify them? Add verification steps if missing.

**4. Step scan:** Every step must let the implementer write exactly one reasonable thing, and no step may carry more than that: a line that decides nothing is a gap, a function body the signature and tests already determine is a transcript. Fix both.

**5. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

**6. Integration test task:** Is there a final integration/end-to-end test task that verifies the whole feature works together? This should be the last task before completion.

**7. Review Focus:** For each input class or failure mode the spec implies, is there a task whose tests exercise it? The five uncovered ones most likely to bite a person go in the Review Focus section, and each line there gets its test added to the owning task. An empty section means you checked and found none, not that you skipped the check.

**8. Delivery contract:** 对 L2+，计划必须包含填写 `delivery.json` 真实 argv、`powersnexus verify delivery <change-name>`、`powersnexus check delivery <change-name>` 与 `powersnexus archive <change-name>`。application 使用启动冒烟和健康检查，library 使用制品验证。

**9. Proportion:** Compare the plan's length to the spec's. A plan several times longer than the spec it implements is a transcript of the program, not a plan. If code blocks are most of the document, replace bodies with signatures, test names and assertions, and check that each step is still unambiguous.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Consistency Check (Auto-Verify)

**MANDATORY: Run the consistency check after self-review.**

Use the PowersNexus CLI tool to verify document consistency:

```bash
node src/cli/powersnexus-cli.js check consistency <change-name>
```

Or if `powersnexus` command is available:

```bash
powersnexus check consistency <change-name>
```

**What it checks:**
- Delta Spec 的每个 REQ-ID 都映射到 proposal.md、design.md、tasks.md 与 cross-reference.md
- 必需规划工件和至少一个 Delta Spec 均存在
- 任务完成度仅作进度展示；规划阶段允许未完成任务

**交付完成后：** 使用 `powersnexus check delivery <change-name>` 验证任务、追踪和 delivery.json 证据，再归档。

**If inconsistencies are found:**
- Fix them before proceeding
- Do NOT skip this step — inconsistent documents cause implementation failures
- Re-run the check after fixes until it passes

**If CLI tool is unavailable:**
- Manually verify cross-references as best you can
- Note the manual verification in deviations.md

## Execution Handoff

After saving and self-reviewing the plan, link it for your human partner
to read. Approving an idea or a scope no longer counts as approving a plan
you have not seen: wait for that review before implementation.

If they have already explicitly supplied an execution method, ask them to
confirm the plan captures what they want; wait for that review, then use
the preserved method. Otherwise, ask them to review the plan and choose an
execution method before implementation.

If the current session already has 自动本地交付授权, skip re-asking for the
execution method and continue on the recommended path after the plan link.

默认使用 `question` 工具提供执行选择。

**When no execution method has already been supplied:**

**"Plan complete and saved to `.novaway/powersnexus/changes/<name>/tasks.md`. Please review the plan. Which execution approach would you prefer?**

- **Subagent-driven** — A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. Most thorough; costs a fresh context per task and per review.
- **Native** — I implement every task myself in this session, then one fresh reviewer on the most capable model checks the whole branch. Cheapest and fastest; no independent review until the end. Runs well with a mid-tier session model, since the plan carries the design.

**For this plan I recommend &lt;one of the two&gt;, because &lt;one sentence from the plan: how much the tasks depend on each other's interfaces, how many there are, what a shipped mistake would cost&gt;. Does the plan capture what you want, and which approach should we use?"**

**When an execution method has already been supplied:**

**"Plan complete and saved to `.novaway/powersnexus/changes/<name>/tasks.md`. Please review the plan. Does it capture what you want?"**

**If Subagent-driven chosen:**
- **REQUIRED SUB-SKILL:** Use PowersNexus:subagent-driven-development
- Fresh subagent per task + two-stage review

**If Native chosen:**
- **REQUIRED SUB-SKILL:** Use PowersNexus:executing-plans
- Continuous inline execution; one whole-branch review at the end
