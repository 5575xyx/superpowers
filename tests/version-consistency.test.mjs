import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const repoRoot = resolve(import.meta.dirname, '..');
const versionFiles = [
  ['package.json', (json) => json.version],
  ['.claude-plugin/plugin.json', (json) => json.version],
  ['.claude-plugin/marketplace.json', (json) => json.plugins[0].version],
  ['.codex-plugin/plugin.json', (json) => json.version],
  ['.cursor-plugin/plugin.json', (json) => json.version],
  ['.kimi-plugin/plugin.json', (json) => json.version],
  ['gemini-extension.json', (json) => json.version],
];

async function readJson(relativePath) {
  const content = await readFile(resolve(repoRoot, relativePath), 'utf8');
  assert.notEqual(content.charCodeAt(0), 0xFEFF, `${relativePath} 不能包含 UTF-8 BOM`);
  return JSON.parse(content);
}

test('所有平台清单使用 package.json 的发布版本', async () => {
  const packageJson = await readJson('package.json');
  for (const [path, selectVersion] of versionFiles) {
    const manifest = await readJson(path);
    assert.equal(selectVersion(manifest), packageJson.version, `${path} 版本不一致`);
  }
});
