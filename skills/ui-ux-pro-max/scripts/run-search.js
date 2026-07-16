#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const searchScript = join(scriptDir, 'search.py');
const candidates = process.platform === 'win32'
  ? [['python', []], ['python3', []], ['py', ['-3']]]
  : [['python3', []], ['python', []]];

for (const [command, prefix] of candidates) {
  const version = spawnSync(command, [...prefix, '--version'], { encoding: 'utf8' });
  const versionOutput = `${version.stdout ?? ''}${version.stderr ?? ''}`;
  if (version.error?.code === 'ENOENT' || version.status !== 0 || !/Python 3\./i.test(versionOutput)) {
    continue;
  }

  const result = spawnSync(command, [...prefix, searchScript, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  });

  if (result.error?.code === 'ENOENT') continue;
  if (result.error) {
    console.error(`无法运行 UI/UX Pro Max 搜索器：${result.error.message}`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

console.error('UI/UX Pro Max 需要 Python 3。请安装 Python 3 后重试。');
process.exit(1);
