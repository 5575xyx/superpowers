import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const repoRoot = resolve(import.meta.dirname, '..');
const usingSkillPath = resolve(repoRoot, 'skills/using-powersnexus/SKILL.md');
const brainstormingSkillPath = resolve(repoRoot, 'skills/brainstorming/SKILL.md');
const writingPlansSkillPath = resolve(repoRoot, 'skills/writing-plans/SKILL.md');
const openSpecSkillPath = resolve(repoRoot, 'skills/openspec/SKILL.md');

test('入口技能按任务级别渐进激活，避免推测性加载', async () => {
  const [usingSkill, brainstormingSkill, writingPlansSkill, openSpecSkill] = await Promise.all([
    readFile(usingSkillPath, 'utf8'),
    readFile(brainstormingSkillPath, 'utf8'),
    readFile(writingPlansSkillPath, 'utf8'),
    readFile(openSpecSkillPath, 'utf8'),
  ]);

  assert.match(usingSkill, /不得因“可能有用”而推测性预加载技能/);
  assert.match(usingSkill, /L0：直接修改并进行聚焦验证/);
  assert.match(usingSkill, /L3\/L4：使用完整规格、风险审查和多阶段验证/);
  assert.doesNotMatch(usingSkill, /even a 1% chance/);
  assert.match(brainstormingSkill, /L0 的机械性改动不调用本技能/);
  assert.match(brainstormingSkill, /## Checklist（仅 L2\+）/);
  assert.match(brainstormingSkill, /L1 已按“渐进执行规则”完成简短假设后直接进入实现和聚焦测试/);
  assert.match(brainstormingSkill, /## Process Flow（L2\+）/);
  assert.match(usingSkill, /自动本地交付授权/);
  assert.match(usingSkill, /推送、创建 PR、合并、部署、账号\/密钥操作/);
  assert.match(brainstormingSkill, /powersnexus init delivery <change-name> --profile/);
  assert.match(writingPlansSkill, /powersnexus verify delivery <change-name>/);
  assert.match(openSpecSkill, /powersnexus init delivery <change-name> --profile/);
});
