import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const repoRoot = resolve(import.meta.dirname, '..');
const cliPath = join(repoRoot, 'src', 'cli', 'powersnexus-cli.js');

function runBridge(projectRoot, args, input) {
  return spawnSync(process.execPath, [cliPath, 'bridge', ...args], {
    cwd: projectRoot,
    input: input ? JSON.stringify(input) : undefined,
    encoding: 'utf8',
  });
}

function createChange(projectRoot) {
  const changeDir = join(projectRoot, '.novaway', 'powersnexus', 'changes', 'react-todo');
  mkdirSync(join(changeDir, 'delta-specs', 'todo'), { recursive: true });
  writeFileSync(join(changeDir, 'proposal.md'), 'REQ-101\n', 'utf8');
  writeFileSync(join(changeDir, 'design.md'), 'REQ-101\n', 'utf8');
  writeFileSync(join(changeDir, 'tasks.md'), '- [x] [TASK-101] 实现 REQ-101\n', 'utf8');
  writeFileSync(join(changeDir, 'delta-specs', 'todo', 'spec.md'), '## ADDED Requirements\n\n### REQ-101: Todo\n', 'utf8');
  return changeDir;
}

test('bridge inspect 的 stdout 仅包含版本化 JSON 快照', (t) => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'powersnexus-bridge-inspect-'));
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }));
  createChange(projectRoot);

  const result = runBridge(projectRoot, ['inspect', '--change', 'react-todo', '--format', 'json']);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  const snapshot = JSON.parse(result.stdout);
  assert.equal(snapshot.protocolVersion, '1.0');
  assert.equal(snapshot.changeName, 'react-todo');
  assert.equal(snapshot.phase, 'needs_traceability');
  assert.deepEqual(snapshot.requirements, [{ id: 'REQ-101', module: 'todo' }]);
  assert.deepEqual(snapshot.tasks, [{ id: 'TASK-101', title: '实现 REQ-101', status: 'completed' }]);
  assert.match(snapshot.artifactDigest, /^[a-f0-9]{64}$/);
  assert.equal(Number.isSafeInteger(snapshot.revision), true);
});

test('bridge 错误只写 stderr，并使用确定性退出码', (t) => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'powersnexus-bridge-error-'));
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }));

  const result = runBridge(projectRoot, ['inspect', '--change', '../escape', '--format', 'json']);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  const failure = JSON.parse(result.stderr);
  assert.equal(failure.error.code, 'CHANGE_NAME_INVALID');
  assert.doesNotMatch(result.stderr, /at src|node:internal/);
});

test('bridge transition 配置 web Profile，并对相同 actionID 幂等重放', (t) => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'powersnexus-bridge-transition-'));
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }));
  const changeDir = createChange(projectRoot);
  writeFileSync(join(changeDir, 'traceability.md'), '| REQ-101 | todo | src/a.ts | tests/a.test.ts | 完成 |\n', 'utf8');
  const inspected = runBridge(projectRoot, ['inspect', '--change', 'react-todo', '--format', 'json']);
  const revision = JSON.parse(inspected.stdout).revision;
  const request = {
    actionID: 'action-configure-001',
    expectedRevision: revision,
    action: 'configure_delivery',
    input: {
      profile: 'web',
      steps: [
        { id: 'build', argv: ['npm', 'run', 'build'] },
        { id: 'test', argv: ['npm', 'test'] },
        { id: 'integration', argv: ['npm', 'run', 'test:integration'] },
        { id: 'run', argv: [], timeoutMs: 600000 },
        { id: 'health', argv: [] },
        { id: 'browser', argv: [] },
      ],
    },
  };

  const first = runBridge(projectRoot, ['transition', '--change', 'react-todo', '--format', 'jsonl'], request);
  assert.equal(first.status, 0, first.stderr);
  const firstEvents = first.stdout.trim().split(/\r?\n/).map(JSON.parse);
  assert.deepEqual(firstEvents.map((event) => event.type), ['action.started', 'action.completed']);
  assert.equal(firstEvents[1].replayed, false);
  assert.equal(firstEvents[1].snapshot.phase, 'ready_to_verify');
  assert.equal(firstEvents[1].snapshot.delivery.profile, 'web');

  const replay = runBridge(projectRoot, ['transition', '--change', 'react-todo', '--format', 'jsonl'], request);
  assert.equal(replay.status, 0, replay.stderr);
  const replayEvents = replay.stdout.trim().split(/\r?\n/).map(JSON.parse);
  assert.equal(replayEvents[1].replayed, true);
});

test('bridge transition 拒绝过期 revision 且不改写工件', (t) => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'powersnexus-bridge-conflict-'));
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }));
  const changeDir = createChange(projectRoot);
  writeFileSync(join(changeDir, 'traceability.md'), 'REQ-101\n', 'utf8');

  const result = runBridge(projectRoot, ['transition', '--change', 'react-todo', '--format', 'jsonl'], {
    actionID: 'action-stale-001',
    expectedRevision: 0,
    action: 'configure_delivery',
    input: { profile: 'application', steps: [] },
  });

  assert.equal(result.status, 3);
  assert.equal(JSON.parse(result.stderr).error.code, 'REVISION_CONFLICT');
  assert.equal(runBridge(projectRoot, ['inspect', '--change', 'react-todo', '--format', 'json']).status, 0);
});
