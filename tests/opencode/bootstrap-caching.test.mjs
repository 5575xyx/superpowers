import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

const repoRoot = resolve(import.meta.dirname, '../..');
const pluginPath = join(repoRoot, '.opencode', 'plugins', 'powersnexus.js');

function createOutput(text) {
  return { messages: [{ info: { role: 'user' }, parts: [{ type: 'text', text }] }] };
}

test('包入口指向当前 OpenCode 插件实现', () => {
  const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
  assert.equal(packageJson.main, '.opencode/plugins/powersnexus.js');
});

test('OpenCode 插件注入并复用启动上下文缓存', async () => {
  const module = await import(`${pathToFileURL(pluginPath).href}?cache=${Date.now()}`);
  const plugin = await module.PowersNexusPlugin({ client: {}, directory: repoRoot });
  const transform = plugin['experimental.chat.messages.transform'];
  const first = createOutput('first');
  const second = createOutput('second');

  await transform({}, first);
  await transform({}, second);

  for (const item of [first, second]) {
    assert.equal(item.messages[0].parts.filter((part) => part.text.includes('EXTREMELY_IMPORTANT')).length, 1);
    assert.match(item.messages[0].parts[0].text, /You have powersnexus/);
  }
});

test('缺少启动技能时 OpenCode 插件不注入上下文', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-opencode-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const temporaryPlugin = join(directory, '.opencode', 'plugins', 'powersnexus.js');
  mkdirSync(dirname(temporaryPlugin), { recursive: true });
  writeFileSync(join(directory, 'package.json'), '{"type":"module"}\n');
  cpSync(pluginPath, temporaryPlugin);

  const module = await import(`${pathToFileURL(temporaryPlugin).href}?cache=${Date.now()}`);
  const plugin = await module.PowersNexusPlugin({ client: {}, directory });
  const item = createOutput('first');
  await plugin['experimental.chat.messages.transform']({}, item);

  assert.equal(item.messages[0].parts.length, 1);
});

test('V1/V2 工具映射常量与默认双栈导出', async () => {
  const module = await import(`${pathToFileURL(pluginPath).href}?dual=${Date.now()}`);

  assert.equal(typeof module.V1_MAPPING, 'string');
  assert.equal(typeof module.V2_MAPPING, 'string');
  assert.match(module.V1_MAPPING, /`todowrite`/);
  assert.match(module.V1_MAPPING, /`task` with `subagent_type: "general"`/);
  assert.match(module.V1_MAPPING, /`apply_patch`/);
  assert.match(module.V2_MAPPING, /`subagent` with `agent: "general"`/);
  assert.match(module.V2_MAPPING, /`sessionID` to continue a previous subagent/);
  assert.match(module.V2_MAPPING, /no todo tool/);
  assert.match(module.V2_MAPPING, /`patch` with `patchText`/);
  assert.match(module.V2_MAPPING, /`shell`/);
  assert.doesNotMatch(module.V2_MAPPING, /`apply_patch`/);
  assert.doesNotMatch(module.V2_MAPPING, /`subagent_type`/);

  assert.equal(module.default.id, 'powersnexus');
  assert.equal(typeof module.default.setup, 'function');
  assert.equal(module.default.server, module.PowersNexusPlugin);
  assert.equal(module.Plugin, module.PowersNexusPlugin);
});

test('V2 setup 注册技能并通过 context 钩子注入 V2 映射', async () => {
  const module = await import(`${pathToFileURL(pluginPath).href}?v2=${Date.now()}`);
  const added = [];
  let contextHook = null;

  const ctx = {
    skill: {
      transform: async (fn) => {
        await fn({ add: (skill) => added.push(skill) });
      },
    },
    session: {
      hook: async (name, callback) => {
        if (name === 'context') contextHook = callback;
      },
      get: async ({ sessionID }) => ({ id: sessionID }),
    },
  };

  await module.default.setup(ctx);
  assert.ok(added.length > 0, 'expected at least one skill registered');
  for (const skill of added) {
    assert.equal(typeof skill.path, 'string');
    assert.ok(skill.path.endsWith(`${skill.id}/SKILL.md`) || skill.path.includes('SKILL.md'));
    assert.equal('location' in skill, false);
    assert.ok(typeof skill.name === 'string' && skill.name.length > 0);
    assert.ok(typeof skill.content === 'string' && skill.content.trim().length > 0);
    assert.equal(skill.content.startsWith('---'), false);
  }

  assert.equal(typeof contextHook, 'function');
  const event = {
    sessionID: 'sess-v2-top',
    messages: [{ role: 'user', content: [{ type: 'text', text: 'v2 bootstrap step' }] }],
  };
  await contextHook(event);
  const parts = event.messages[0].content.filter(
    (part) => part.type === 'text' && part.text.includes('EXTREMELY_IMPORTANT'),
  );
  assert.equal(parts.length, 1);
  assert.match(parts[0].text, /You have powersnexus/);
  assert.match(parts[0].text, /`subagent` with `agent: "general"`/);
  assert.doesNotMatch(parts[0].text, /`apply_patch`/);
  assert.doesNotMatch(parts[0].text, /`todowrite`/);

  // 重复触发不重复注入
  await contextHook(event);
  const again = event.messages[0].content.filter(
    (part) => part.type === 'text' && part.text.includes('EXTREMELY_IMPORTANT'),
  );
  assert.equal(again.length, 1);
});

test('子会话（parentID）跳过 bootstrap 注入', async () => {
  const module = await import(`${pathToFileURL(pluginPath).href}?child=${Date.now()}`);

  // V1
  const v1 = await module.PowersNexusPlugin({
    client: {
      session: {
        get: ({ path: { id } }) => ({ data: { id, parentID: 'parent' } }),
      },
    },
    directory: repoRoot,
  });
  const v1Item = createOutput('child');
  v1Item.messages[0].info.sessionID = 'child-1';
  await v1['experimental.chat.messages.transform']({}, v1Item);
  assert.equal(
    v1Item.messages[0].parts.filter((p) => p.text?.includes('EXTREMELY_IMPORTANT')).length,
    0,
  );

  // V2
  let hook = null;
  await module.default.setup({
    skill: { transform: async (fn) => fn({ add: () => {} }) },
    session: {
      hook: async (name, cb) => { if (name === 'context') hook = cb; },
      get: async ({ sessionID }) => ({ id: sessionID, parentID: 'parent' }),
    },
  });
  const event = {
    sessionID: 'child-v2',
    messages: [{ role: 'user', content: [{ type: 'text', text: 'work' }] }],
  };
  await hook(event);
  assert.equal(
    event.messages[0].content.filter((p) => p.text?.includes('EXTREMELY_IMPORTANT')).length,
    0,
  );
});

test('V1 形态的 setup ctx 静默返回', async () => {
  const module = await import(`${pathToFileURL(pluginPath).href}?v1setup=${Date.now()}`);
  // V1 形态：缺少 skill/session 域，setup 应静默返回且不抛错
  await assert.doesNotReject(() => module.default.setup({}));
  await assert.doesNotReject(() => module.default.setup(null));
});
