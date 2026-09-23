import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const repoRoot = resolve(import.meta.dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const requiredFiles = [
  'index.js',
  '.opencode/plugins/powersnexus.js',
  'skills/frontend-quality/SKILL.md',
  'skills/ui-ux-pro-max/SKILL.md',
  'skills/openspec/templates/delivery.json',
  'src/bridge/index.js',
  'schemas/protocol-v1.json',
  'schemas/profile-v1.json',
  'schemas/update-manifest-v1.json',
  'profiles/application.json',
  'profiles/library.json',
  'profiles/web.json',
  'scripts/build-release-artifact.mjs',
  'scripts/sign-release-manifest.mjs',
];
const excludedPrefixes = ['.codex/', 'docs/', 'superpowers-main/', 'tests/'];

test('npm 发布制品包含运行能力且排除开发文件', () => {
  const cacheDirectory = mkdtempSync(join(tmpdir(), 'powersnexus-npm-cache-'));
  try {
    const result = spawnSync(
      npmCommand,
      ['pack', '--dry-run', '--json', '--ignore-scripts'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, npm_config_cache: cacheDirectory },
        shell: process.platform === 'win32',
      },
    );

    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const [artifact] = JSON.parse(result.stdout);
    const packagedFiles = artifact.files.map((file) => file.path);
    const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));

    assert.equal(artifact.version, packageJson.version, '制品版本必须与 package.json 一致');
    for (const file of requiredFiles) {
      assert.ok(packagedFiles.includes(file), `发布制品缺少运行文件：${file}`);
    }
    for (const prefix of excludedPrefixes) {
      assert.equal(packagedFiles.some((file) => file.startsWith(prefix)), false, `发布制品不应包含：${prefix}`);
    }
    assert.equal(packagedFiles.includes('.opencode/plugins/superpowers.js'), false, '发布制品不应包含旧插件入口');
    assert.equal(packagedFiles.some((file) => file.includes('__pycache__/')), false, '发布制品不应包含 Python 缓存');
  } finally {
    rmSync(cacheDirectory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
});
