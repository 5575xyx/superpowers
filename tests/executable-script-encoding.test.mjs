import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import test from 'node:test';

const repoRoot = resolve(import.meta.dirname, '..');
const checkedExtensions = new Set(['.sh', '.cmd', '.json']);
const ignoredDirectories = new Set(['.git', 'node_modules']);

async function findCheckedFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const scripts = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        scripts.push(...await findCheckedFiles(join(directory, entry.name)));
      }
      continue;
    }

    if (entry.isFile() && checkedExtensions.has(entry.name.slice(entry.name.lastIndexOf('.')))) {
      scripts.push(join(directory, entry.name));
    }
  }

  return scripts;
}

test('可执行脚本和 JSON 清单不包含 UTF-8 BOM', async () => {
  const scripts = await findCheckedFiles(repoRoot);
  assert.ok(scripts.length > 0, '仓库中应存在至少一个受检查文件');

  const filesWithBom = [];
  for (const scriptPath of scripts) {
    const content = await readFile(scriptPath);
    if (content.length >= 3 && content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
      filesWithBom.push(relative(repoRoot, scriptPath));
    }
  }

  assert.deepEqual(filesWithBom, [], 'Bash 与严格 JSON 解析器会拒绝 UTF-8 BOM，以下文件必须移除 BOM');
});
