import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const repoRoot = resolve(import.meta.dirname, '..');
const skillPath = resolve(repoRoot, 'skills/frontend-quality/SKILL.md');
const checklistPath = resolve(repoRoot, 'skills/frontend-quality/references/acceptance-checklist.md');
const brainstormingPath = resolve(repoRoot, 'skills/brainstorming/SKILL.md');
const planningPath = resolve(repoRoot, 'skills/writing-plans/SKILL.md');
const reviewSkillPath = resolve(repoRoot, 'skills/requesting-code-review/SKILL.md');
const reviewPromptPath = resolve(repoRoot, 'skills/requesting-code-review/code-reviewer.md');
const verificationPath = resolve(repoRoot, 'skills/verification-before-completion/SKILL.md');
const visualReviewPath = resolve(repoRoot, 'skills/frontend-quality/references/visual-review.md');
const uiUxPath = resolve(repoRoot, 'skills/ui-ux-pro-max/SKILL.md');
const uiUxLicensePath = resolve(repoRoot, 'skills/ui-ux-pro-max/LICENSE');
const uiUxRunnerPath = resolve(repoRoot, 'skills/ui-ux-pro-max/scripts/run-search.js');

test('frontend-quality 技能提供明确的触发条件与视觉验收流程', async () => {
  const skill = await readFile(skillPath, 'utf8');
  const checklist = await readFile(checklistPath, 'utf8');

  assert.match(skill, /^---\nname: frontend-quality\ndescription: .+\n---/);
  for (const required of ['设计契约', '响应式', '可访问性', '视觉验收']) {
    assert.match(skill, new RegExp(required));
  }
  assert.match(checklist, /桌面/);
  assert.match(checklist, /移动端/);
  assert.match(checklist, /键盘/);
});

test('UI 工作流在设计批准后接入前端质量与计划阶段', async () => {
  const brainstorming = await readFile(brainstormingPath, 'utf8');
  const planning = await readFile(planningPath, 'utf8');

  assert.match(brainstorming, /ui-ux-pro-max/);
  assert.match(brainstorming, /frontend-quality/);
  assert.match(planning, /approved visual contract/);
});

test('UI 交付需要实际视觉审查证据', async () => {
  const [protocol, reviewSkill, reviewPrompt, verification] = await Promise.all([
    readFile(visualReviewPath, 'utf8'),
    readFile(reviewSkillPath, 'utf8'),
    readFile(reviewPromptPath, 'utf8'),
    readFile(verificationPath, 'utf8'),
  ]);

  assert.match(protocol, /1440px/);
  assert.match(protocol, /390px/);
  assert.match(protocol, /不能标记为准备合并/);
  assert.match(reviewSkill, /视觉审查协议/);
  assert.match(reviewPrompt, /A code diff is not visual evidence/);
  assert.match(verification, /Desktop\/mobile preview evidence/);
});

test('ui-ux-pro-max 随插件提供许可证、本地数据和跨平台搜索入口', async () => {
  const [skill, license] = await Promise.all([
    readFile(uiUxPath, 'utf8'),
    readFile(uiUxLicensePath, 'utf8'),
  ]);

  assert.match(skill, /^---\nname: ui-ux-pro-max\ndescription: .+\n---/);
  assert.match(skill, /run-search\.js/);
  assert.match(license, /MIT License/);
  assert.match(license, /Next Level Builder/);
  assert.equal(existsSync(uiUxRunnerPath), true);
  assert.equal(existsSync(resolve(repoRoot, 'skills/ui-ux-pro-max/data/styles.csv')), true);
});
