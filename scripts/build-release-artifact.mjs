import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { canonicalizeJson, createStoredZip, sha256 } from './release-utils.mjs';

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const root = resolve(import.meta.dirname, '..');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const outputDirectory = resolve(root, option('--output', 'dist/release'));
const channel = option('--channel', 'stable');
const sourceCommit = option('--source-commit', process.env.POWERSNEXUS_SOURCE_COMMIT || '');
const artifactBaseUrl = option('--artifact-base-url', process.env.POWERSNEXUS_ARTIFACT_BASE_URL || '');
const minimumNovaWayVersion = option('--minimum-novaway-version', process.env.POWERSNEXUS_MINIMUM_NOVAWAY_VERSION || '1.3.0');
const maximumNovaWayVersion = option('--maximum-novaway-version', process.env.POWERSNEXUS_MAXIMUM_NOVAWAY_VERSION || '<2.0.0');
const keyID = option('--key-id', process.env.POWERSNEXUS_RELEASE_KEY_ID || '');
const publishedAt = option('--published-at', process.env.SOURCE_DATE_EPOCH
  ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
  : new Date().toISOString());

if (!/^[a-fA-F0-9]{40}$/.test(sourceCommit)) throw new Error('--source-commit 必须是 40 位 Git SHA。');
if (!/^https:\/\//.test(artifactBaseUrl)) throw new Error('--artifact-base-url 必须是 HTTPS 地址。');
if (!/^[a-zA-Z0-9._-]{1,128}$/.test(keyID)) throw new Error('--key-id 必须是稳定密钥标识。');
if (!['stable', 'preview'].includes(channel)) throw new Error('--channel 仅支持 stable 或 preview。');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmCache = join(outputDirectory, '.npm-cache');
mkdirSync(npmCache, { recursive: true });
const packResult = spawnSync(npmCommand, ['pack', '--dry-run', '--json', '--ignore-scripts'], {
  cwd: root,
  encoding: 'utf8',
  shell: process.platform === 'win32',
  env: { ...process.env, npm_config_cache: npmCache },
});
rmSync(npmCache, { recursive: true, force: true });
if (packResult.error || packResult.status !== 0) throw new Error(packResult.error?.message || packResult.stderr || 'npm pack 失败。');
const packOutput = packResult.stdout;
const [pack] = JSON.parse(packOutput);
const paths = pack.files.map((file) => file.path.normalize('NFC').replaceAll('\\', '/')).sort((left, right) => left.localeCompare(right, 'en'));
const entries = paths.map((path) => ({ path, content: readFileSync(join(root, path)) }));
const fileList = entries.map((entry) => `${sha256(entry.content)}  ${entry.path}\n`).join('');
const timestamp = new Date(publishedAt);
if (Number.isNaN(timestamp.getTime())) throw new Error('--published-at 必须是 ISO 时间。');
const artifactName = `powersnexus-${packageJson.version}.zip`;
const artifact = createStoredZip(entries, timestamp);
const manifest = {
  schemaVersion: '1',
  version: packageJson.version,
  channel,
  protocolVersion: '1.0',
  minimumNovaWayVersion,
  maximumNovaWayVersion,
  sourceCommit: sourceCommit.toLowerCase(),
  artifactUrl: `${artifactBaseUrl.replace(/\/$/, '')}/${artifactName}`,
  artifactSha256: sha256(artifact),
  filesSha256: sha256(Buffer.from(fileList, 'utf8')),
  artifactSize: artifact.length,
  fileCount: entries.length,
  publishedAt: timestamp.toISOString(),
  keyID,
};
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(join(outputDirectory, artifactName), artifact);
writeFileSync(join(outputDirectory, 'files.sha256'), fileList, 'utf8');
writeFileSync(join(outputDirectory, 'manifest.unsigned.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
writeFileSync(join(outputDirectory, 'manifest.canonical.json'), canonicalizeJson(manifest), 'utf8');
console.log(JSON.stringify({ outputDirectory, artifact: basename(artifactName), ...manifest }));
