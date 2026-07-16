import assert from 'node:assert/strict';
import test from 'node:test';
import { ConfigManager } from '../../src/code-style-checker/config';

test('ConfigManager 忽略不存在的配置文件并回退到默认值', () => {
  const config = new ConfigManager().load('does-not-exist.json');
  assert.equal(config.format, 'terminal');
  assert.equal(config.rules['line-length'].enabled, true);
});
