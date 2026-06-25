# Exploration Mode

探索模式——为研究型、探索性工作设计的专用流程

## When to Use Exploration Mode

Use exploration mode when:
- **Technical research** - "Will this library work for our use case?"
- **Prototype validation** - "Can this approach work at all?"
- **Bug investigation** - "What's causing this intermittent failure?"
- **Creative design** - "What's the best UX for this feature?"
- **Architecture spikes** - "How would we integrate system X?"
- **Performance testing** - "Can this handle 10x load?"
- **Unknown unknowns** - "I'm not sure what I don't know yet"

**Do NOT use when:**
- Requirements are clear and well-defined
- You know exactly what to build
- The path forward is straightforward
- Use standard OpenSpec workflow instead

---

## Exploration Workflow

```
1. Define Exploration Goal
       ↓
2. Set Timebox (time limit)
       ↓
3. Research & Experiment
       ↓
4. Record Findings
       ↓
5. Decision Expert Assessment
       ├─ ✅ Validation successful → Transition to standard workflow
       ├─ ❌ Validation failed → Abandon or pivot
       └─ ⚠️ Need more data → Continue next round
```

---

## The Process

### Step 1: Define Exploration Goal

**Before doing anything, clearly define what you're trying to learn:**

```markdown
## Exploration Goal

**Hypothesis to validate:** [What are you trying to prove or disprove?]

**Success criteria:**
- [Criterion 1]
- [Criterion 2]
- [Criterion 3]

**Questions to answer:**
1. [Question 1]
2. [Question 2]
3. [Question 3]

**Out of scope:**
- [What you're NOT trying to answer]
```

---

### Step 2: Set Timebox

**Define how long you'll spend on this exploration:**

- **Quick spike**: 30 min - 1 hour
- **Standard exploration**: 2 - 4 hours
- **Deep dive**: 1 - 2 days
- **Research project**: 1 week+

**Why timebox?**
- Prevents endless rabbit holes
- Forces focus on the most important questions
- Encourages rapid prototyping over perfection
- Provides natural stopping points for reassessment

---

### Step 3: Research & Experiment

**Guidelines for exploration:**
- Start with the most critical questions first
- Build the smallest possible prototype
- Test the riskiest assumptions early
- Keep notes of everything you try
- Record failures as well as successes
- Don't worry about code quality - this is a throwaway prototype

**What to track:**
- Approaches tried and what happened
- Useful resources (links, docs, articles)
- Surprising findings
- Performance numbers
- Error messages and how you debugged them

---

### Step 4: Record Findings

**Document everything you learned:**

Use these templates:
- `exploration-log.md` - Day-to-day notes of what you tried
- `findings.md` - Summary of what you learned
- `recommendations.md` - What to do next

See `skills/openspec/templates/` for full templates.

---

### Step 5: Decision Expert Assessment

**After exploration, assess the findings and recommend next steps:**

**Decision Expert will evaluate:**
- Was the hypothesis proven or disproven?
- How confident are we in the findings?
- What are the options going forward?
- What are the risks of each option?
- What would be the next step if we proceed?

**Possible outcomes:**

| Outcome | Meaning | Next Step |
|---------|---------|-----------|
| ✅ **Validation Success** | The approach works, we should build it | Transition to standard workflow |
| ❌ **Validation Failed** | The approach doesn't work | Abandon or try a different approach |
| ⚠️ **More Data Needed** | We learned something but not enough | Continue with another exploration round |
| 🤔 **Partially Successful** | Works but with significant caveats | Decision point: proceed with caveats or pivot? |

---

## Transitioning to Standard Workflow

**If exploration validates the approach:**

1. Use the findings as input to brainstorming
2. Generate a formal proposal based on what you learned
3. Enter the standard OpenSpec workflow
4. The exploration artifacts serve as background research

**The exploration output becomes:**
- Input to design decisions
- Reference for why certain choices were made
- Documentation of alternatives considered and rejected

---

## Multiple Exploration Rounds

**It's normal to have multiple rounds:**
- Round 1: Basic feasibility check
- Round 2: Performance validation
- Round 3: Edge case testing
- etc.

Each round should have:
- Clear goal
- Timebox
- Findings document
- Go/No-go decision

---

## Anti-Patterns

**Don't do these:**
1. **Endless exploration** - Keep going back for "just one more thing"
2. **No clear goal** - "Let's just play around and see what we find"
3. **Perfect code** - Spending time cleaning up prototype code
4. **No documentation** - Forgetting what you tried and why
5. **Skipping the decision** - Just continuing without assessing

---

## Output Location

Exploration artifacts are stored at:
```
.novaway/powersnexus/explorations/
└── 2024-01-15-<exploration-name>/
    ├── exploration-log.md
    ├── findings.md
    ├── recommendations.md
    └── prototype/  # if any code was written (can be deleted later)
```

Completed explorations can be moved to knowledge base as reference.

---

## Checklist

You MUST complete these steps in order:

1. **Define goal** - What are you trying to learn? What's your hypothesis?
2. **Set timebox** - How long will you spend? When will you stop?
3. **Research & experiment** - Try things, build prototypes, test assumptions
4. **Record findings** - Document everything: what worked, what didn't, what you learned
5. **Decision expert assessment** - Evaluate findings, recommend next steps
6. **User review** - Present findings and recommendation to user for final decision