import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { run } from '../../src/code-style-checker/cli';

async function captureLogs(action: () => Promise<void>): Promise<string[]> {
  const originalLog = console.log;
  const output: string[] = [];
  console.log = (...args: unknown[]) => output.push(args.join(' '));
  try {
    await action();
    return output;
  } finally {
    console.log = originalLog;
  }
}

test('代码风格 CLI 显示帮助与规则列表', async () => {
  const help = await captureLogs(() => run(['help']));
  const list = await captureLogs(() => run(['list']));
  assert.match(help.join('\n'), /Code Style Checker/);
  assert.match(list.join('\n'), /indentation/);
});

test('代码风格 CLI 初始化配置文件', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-cli-'));
  const originalCwd = process.cwd();
  t.after(() => {
    process.chdir(originalCwd);
    rmSync(directory, { recursive: true, force: true });
  });
  process.chdir(directory);
  await run(['init']);
  const configPath = join(directory, '.code-style.json');
  assert.equal(existsSync(configPath), true);
  assert.ok(JSON.parse(readFileSync(configPath, 'utf8')).rules);
});
