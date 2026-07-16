import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import test from 'node:test';

const repoRoot = resolve(import.meta.dirname, '..');
const runnerPath = resolve(repoRoot, 'skills/ui-ux-pro-max/scripts/run-search.js');

test('ui-ux-pro-max 搜索入口在 Python 3 环境返回设计结果且不生成缓存', () => {
  const result = spawnSync(process.execPath, [
    runnerPath,
    'fintech dashboard trustworthy',
    '--domain', 'color',
    '--max-results', '1',
  ], { cwd: repoRoot, encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /UI Pro Max Search Results/);
  assert.equal(existsSync(resolve(repoRoot, 'skills/ui-ux-pro-max/scripts/__pycache__')), false);
});
