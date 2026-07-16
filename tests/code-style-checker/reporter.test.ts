import assert from 'node:assert/strict';
import test from 'node:test';
import { formatJson, formatMarkdown, formatTerminal } from '../../src/code-style-checker/reporter/formatters';
import type { ScanResult } from '../../src/code-style-checker/types';

const result: ScanResult = {
  files: 1,
  issues: [{
    file: 'src/test.ts', line: 5, column: 10, rule: 'line-length', severity: 'warning',
    message: '行长度超过120字符', suggestion: '拆分过长的行',
  }],
  summary: { error: 0, warning: 1, info: 0 },
  time: 100,
};

test('报告格式化器输出完整 JSON', () => {
  assert.deepEqual(JSON.parse(formatJson(result)), result);
});

test('报告格式化器输出 Markdown 与终端摘要', () => {
  assert.match(formatMarkdown(result), /Files scanned: 1/);
  assert.match(formatMarkdown(result), /src\/test.ts/);
  assert.match(formatTerminal(result), /Warnings:/);
  assert.match(formatTerminal(result), /src\/test.ts/);
});
