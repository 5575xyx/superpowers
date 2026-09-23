import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const tests = [
  'tests/code-style-checker/config.test.ts',
  'tests/code-style-checker/config-simple.test.ts',
  'tests/code-style-checker/engine.test.ts',
  'tests/code-style-checker/reporter.test.ts',
  'tests/code-style-checker/cli.test.ts',
  'tests/powersnexus-cli.test.mjs',
  'tests/bridge-contract.test.mjs',
  'tests/release-artifact.test.mjs',
  'tests/version-consistency.test.mjs',
  'tests/executable-script-encoding.test.mjs',
  'tests/platform-quality-gates.test.mjs',
  'tests/progressive-activation.test.mjs',
  'tests/opencode/bootstrap-caching.test.mjs',
  'tests/frontend-quality-skill.test.mjs',
  'tests/upstream-absorption.test.mjs',
  'tests/pi/test-pi-extension.mjs',
].map((file) => resolve(repoRoot, file));

const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...tests], {
  cwd: repoRoot,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
