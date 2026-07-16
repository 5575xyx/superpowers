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
