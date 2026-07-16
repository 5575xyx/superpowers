import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const repoRoot = resolve(import.meta.dirname, '..');
const platformRunnerPath = resolve(repoRoot, 'tests/run-platform-tests.sh');
const workflowPath = resolve(repoRoot, '.github/workflows/test.yml');
const testingGuidePath = resolve(repoRoot, 'docs/testing.md');
const packagePath = resolve(repoRoot, 'package.json');

test('平台质量门槛覆盖 Shell lint 与 Codex 同步前置条件', async () => {
  const [runner, workflow, guide, packageText] = await Promise.all([
    readFile(platformRunnerPath, 'utf8'),
    readFile(workflowPath, 'utf8'),
    readFile(testingGuidePath, 'utf8'),
    readFile(packagePath, 'utf8'),
  ]);
  const packageJson = JSON.parse(packageText);

  assert.match(runner, /tests\/shell-lint\/test-lint-shell\.sh/);
  assert.match(runner, /command -v rsync/);
  assert.match(runner, /PowersNexus_REQUIRE_RSYNC_TESTS/);
  assert.match(runner, /Codex 插件同步回归/);
  assert.match(workflow, /PowersNexus_REQUIRE_RSYNC_TESTS: '1'/);
  assert.match(guide, /Shell lint/);
  assert.match(guide, /rsync/);
  assert.equal(packageJson.scripts['test:all'], 'npm run test:core && npm run test:uiux && npm run test:platform && npm run test:package');
});
