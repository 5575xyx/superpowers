import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { ConfigManager } from '../../src/code-style-checker/config';
import { RuleEngine } from '../../src/code-style-checker/engine';

function createFixture(t: test.TestContext): string {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-style-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('RuleEngine 扫描支持的源文件并报告规则问题', async (t) => {
  const directory = createFixture(t);
  writeFileSync(join(directory, 'sample.ts'), 'const myVar = 1;\nlet API_value = 2;\n');
  const result = await new RuleEngine().scan(directory);
  assert.equal(result.files, 1);
  assert.ok(result.issues.some((issue) => issue.rule === 'naming'));
});

test('RuleEngine 排除配置的目录', async (t) => {
  const directory = createFixture(t);
  const excluded = join(directory, 'node_modules');
  mkdirSync(excluded);
  writeFileSync(join(excluded, 'vendor.js'), 'const x = 1;\n');
  writeFileSync(join(directory, 'source.ts'), 'const y = 2;\n');
  const config = new ConfigManager().mergeWithDefaults({ exclude: ['node_modules'] });
  const result = await new RuleEngine(config).scan(directory);
  assert.equal(result.files, 1);
  assert.ok(result.issues.every((issue) => !issue.file.includes('node_modules')));
});

test('RuleEngine 对不存在的目录抛出错误', async () => {
  await assert.rejects(new RuleEngine().scan(join(tmpdir(), 'powersnexus-missing-directory')));
});
