import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const repoRoot = resolve(import.meta.dirname, '..');
const read = (...parts) => readFile(resolve(repoRoot, ...parts), 'utf8');

test('writing-plans 吸收上游 Spec 指针、Review Focus 与计划审阅门', async () => {
  const skill = await read('skills/writing-plans/SKILL.md');

  assert.match(skill, /\*\*Spec:\*\*/);
  assert.match(skill, /## Review Focus/);
  assert.match(skill, /powersnexus verify delivery <change-name>/);
  assert.match(skill, /approved visual contract/);
  assert.match(skill, /Please review the plan/);
  assert.match(skill, /Subagent-driven/i);
  assert.match(skill, /Native/i);
  assert.match(skill, /wait for that\s+review before implementation|先.*审阅.*再.*实现|确认.*计划.*再.*实现/is);
});

test('executing-plans 重建为 Native 执行并提供 task-start/task-done', async () => {
  const skill = await read('skills/executing-plans/SKILL.md');

  assert.match(skill, /task-start/);
  assert.match(skill, /task-done/);
  assert.match(skill, /Ruling:/);
  assert.match(skill, /Continuous execution|连续执行/);
  assert.match(skill, /final whole-branch review|全分支.*审查|whole-branch review/i);
  assert.equal(existsSync(resolve(repoRoot, 'skills/executing-plans/scripts/task-start')), true);
  assert.equal(existsSync(resolve(repoRoot, 'skills/executing-plans/scripts/task-done')), true);
});

test('TDD 要求项目全套件绿并链接 writing-good-tests', async () => {
  const skill = await read('skills/test-driven-development/SKILL.md');
  const goodTests = await read('skills/test-driven-development/writing-good-tests.md');

  assert.match(skill, /project's suite|项目.*套件|项目.*全套件|project suite/i);
  assert.match(skill, /writing-good-tests\.md/);
  assert.match(goodTests, /Name the Break|点名会坏掉的生产改动|Name the production change/i);
  assert.match(goodTests, /Mutation Check|变异检查/i);
});

test('审查吸收合理用户预期、Declined to judge 与 merge-base，且保留视觉审查', async () => {
  const skill = await read('skills/requesting-code-review/SKILL.md');
  const reviewer = await read('skills/requesting-code-review/code-reviewer.md');

  assert.match(skill, /git merge-base origin\/main HEAD/);
  assert.match(skill, /视觉审查协议/);
  assert.match(reviewer, /Declined to judge/);
  assert.match(reviewer, /reasonable (person|user)|合理用户|reasonable person/i);
  assert.match(reviewer, /A code diff is not visual evidence/);
  assert.match(reviewer, /You Do Not Dispatch Subagents|不得再派子代理/i);
});

test('SDD 吸收 plan-scoped 工作区、空区间守卫与 resume 修复循环', async () => {
  const skill = await read('skills/subagent-driven-development/SKILL.md');
  const workspace = await read('skills/subagent-driven-development/scripts/sdd-workspace');
  const reviewPkg = await read('skills/subagent-driven-development/scripts/review-package');
  const taskBrief = await read('skills/subagent-driven-development/scripts/task-brief');
  const reReview = await read('skills/subagent-driven-development/re-review-prompt.md');
  const executing = await read('skills/executing-plans/SKILL.md');
  const taskDone = await read('skills/executing-plans/scripts/task-done');

  assert.match(workspace, /Usage: sdd-workspace PLAN_FILE/);
  assert.match(workspace, /\.powersnexus\/sdd/);
  assert.match(workspace, /plan-path/);
  assert.match(workspace, /root=\$\(CDPATH= cd -- "\$root" && pwd -P\)|pwd -P/);
  assert.match(reviewPkg, /Usage: review-package PLAN_FILE BASE HEAD/);
  assert.match(reviewPkg, /empty commit range/);
  assert.match(reviewPkg, /not a descendant/);
  assert.match(taskBrief, /sdd-workspace" "\$plan"|sdd-workspace" \\\$plan|\$\{BASH:-bash\}/);
  assert.match(skill, /review-package PLAN_FILE/);
  assert.match(skill, /task-brief PLAN_FILE/);
  assert.match(skill, /re-review-prompt\.md/);
  assert.match(skill, /fix round/i);
  assert.match(skill, /Rounds 1-3|resume the original implementer/i);
  assert.match(skill, /# PowersNexus ledger — plan:|SDD ledger/);
  assert.match(reReview, /ADDRESSED \| NOT ADDRESSED|ADDRESSED/);
  assert.match(executing, /review-package PLAN_FILE|sdd-workspace PLAN_FILE|review-package "\$plan"/);
  assert.match(taskDone, /sdd-workspace" "\$plan"|sdd-workspace \$plan|sdd-workspace" "\$PLAN/s);
});

test('OpenCode 插件双栈导出 V1/V2 工具映射', async () => {
  const plugin = await read('.opencode/plugins/powersnexus.js');

  assert.match(plugin, /export const V1_MAPPING/);
  assert.match(plugin, /export const V2_MAPPING/);
  assert.match(plugin, /export const PowersNexusPlugin/);
  assert.match(plugin, /setup\s*\(/);
  assert.match(plugin, /id:\s*['"]powersnexus['"]/);
  assert.match(plugin, /agent: "general"/);
  assert.match(plugin, /using-powersnexus/);
  assert.match(plugin, /ctx\.skill\.transform|skill\.transform/);
});
