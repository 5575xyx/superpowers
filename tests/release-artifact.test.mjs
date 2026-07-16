import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { canonicalizeJson, sha256 } from '../scripts/release-utils.mjs';

const repoRoot = resolve(import.meta.dirname, '..');
const buildScript = join(repoRoot, 'scripts', 'build-release-artifact.mjs');
const signScript = join(repoRoot, 'scripts', 'sign-release-manifest.mjs');
const sourceCommit = '0123456789abcdef0123456789abcdef01234567';
const publishedAt = '2026-07-16T00:00:00.000Z';

test('RFC 8785 规范化排序对象键并拒绝未配对代理项', () => {
  assert.equal(canonicalizeJson({ z: 1, a: ['中文', -0] }), '{"a":["中文",0],"z":1}');
  assert.throws(() => canonicalizeJson({ value: '\ud800' }), /RFC 8785/);
});

function build(output) {
  return spawnSync(process.execPath, [
    buildScript,
    '--output', output,
    '--source-commit', sourceCommit,
    '--artifact-base-url', 'https://releases.example.com/powersnexus',
    '--key-id', 'powersnexus-release-test',
    '--published-at', publishedAt,
  ], { cwd: repoRoot, encoding: 'utf8' });
}

test('发布构建生成可复现 ZIP、文件摘要和未签名 Manifest', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-release-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const first = join(directory, 'first');
  const second = join(directory, 'second');

  const firstResult = build(first);
  const secondResult = build(second);

  assert.equal(firstResult.status, 0, firstResult.stderr);
  assert.equal(secondResult.status, 0, secondResult.stderr);
  const firstManifest = JSON.parse(readFileSync(join(first, 'manifest.unsigned.json'), 'utf8'));
  const secondManifest = JSON.parse(readFileSync(join(second, 'manifest.unsigned.json'), 'utf8'));
  const artifactName = `powersnexus-${firstManifest.version}.zip`;
  const firstArtifact = readFileSync(join(first, artifactName));
  const secondArtifact = readFileSync(join(second, artifactName));
  assert.equal(firstManifest.protocolVersion, '1.0');
  assert.equal(firstManifest.sourceCommit, sourceCommit);
  assert.equal(firstManifest.artifactSha256, sha256(firstArtifact));
  assert.equal(firstManifest.filesSha256, sha256(readFileSync(join(first, 'files.sha256'))));
  assert.equal(firstManifest.fileCount > 10, true);
  assert.deepEqual(firstManifest, secondManifest);
  assert.equal(firstArtifact.equals(secondArtifact), true);
  assert.equal(readFileSync(join(first, 'manifest.canonical.json'), 'utf8'), canonicalizeJson(firstManifest));
  const listing = spawnSync('tar', ['-tf', join(first, artifactName)], { encoding: 'utf8' });
  assert.equal(listing.status, 0, listing.stderr);
  assert.match(listing.stdout, /package\.json/);
  assert.match(listing.stdout, /src\/bridge\/index\.js/);
});

test('签名脚本只接受 Ed25519，并生成可验证签名', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-sign-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const output = join(directory, 'release');
  assert.equal(build(output).status, 0);
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const privateKeyPath = join(directory, 'release-private-key.pem');
  writeFileSync(privateKeyPath, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });

  const result = spawnSync(process.execPath, [
    signScript,
    '--manifest', join(output, 'manifest.unsigned.json'),
    '--output', join(output, 'manifest.json'),
    '--private-key', privateKeyPath,
  ], { cwd: repoRoot, encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr);
  const signed = JSON.parse(readFileSync(join(output, 'manifest.json'), 'utf8'));
  const signature = Buffer.from(signed.signature, 'base64');
  delete signed.signature;
  assert.equal(verify(null, Buffer.from(canonicalizeJson(signed), 'utf8'), publicKey, signature), true);

  const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
  const rsaPath = join(directory, 'rsa-private-key.pem');
  writeFileSync(rsaPath, rsa.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  const rejected = spawnSync(process.execPath, [
    signScript,
    '--manifest', join(output, 'manifest.unsigned.json'),
    '--output', join(output, 'invalid-manifest.json'),
    '--private-key', rsaPath,
  ], { cwd: repoRoot, encoding: 'utf8' });
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /Ed25519/);
});

test('发布构建拒绝不可信地址和缺失发布身份', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-release-invalid-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  mkdirSync(directory, { recursive: true });
  const result = spawnSync(process.execPath, [
    buildScript,
    '--output', directory,
    '--source-commit', 'not-a-commit',
    '--artifact-base-url', 'http://example.com',
    '--key-id', 'test',
  ], { cwd: repoRoot, encoding: 'utf8' });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /source-commit/);
});
