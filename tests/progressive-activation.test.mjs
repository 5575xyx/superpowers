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

test('通用化路由将非编码与轻量编码工作接入 grill-me 拷问入口', async () => {
  const [usingSkill, grillMeSkill, assessorSkill] = await Promise.all([
    readFile(usingSkillPath, 'utf8'),
    readFile(resolve(repoRoot, 'skills/grill-me/SKILL.md'), 'utf8'),
    readFile(resolve(repoRoot, 'skills/task-size-assessor/SKILL.md'), 'utf8'),
  ]);

  assert.match(usingSkill, /通用化轨道路由（双轴）/);
  assert.match(usingSkill, /非编码（文档\/PRD\/数据\/运营）/);
  assert.match(usingSkill, /小\/个人（L0-L1） \| 轻量链/);
  assert.match(usingSkill, /grill-me 拷问中暴露复杂度.*单向升级 L2\+/);

  assert.match(grillMeSkill, /^---\nname: grill-me/s);
  assert.match(grillMeSkill, /升级触发线/);
  assert.match(grillMeSkill, /升级交接协议/);
  assert.match(grillMeSkill, /零文档副作用/);
  assert.match(grillMeSkill, /每次只问一个问题（使用 `question` 工具/);

  assert.match(assessorSkill, /7\. 工作类型（通用化路由）/);
  assert.match(assessorSkill, /非编码 → 跳过 L0-L4 打分，直接路由非编码轨道/);
  assert.match(assessorSkill, /小项目\/个人项目/);
});
