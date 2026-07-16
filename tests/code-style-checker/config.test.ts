import assert from 'node:assert/strict';
import test from 'node:test';
import { ConfigManager, DEFAULT_CONFIG } from '../../src/code-style-checker/config';

test('ConfigManager 在未提供配置文件时返回默认配置', () => {
  const config = new ConfigManager().load();
  assert.equal(config.format, 'terminal');
  assert.deepEqual(config.exclude, DEFAULT_CONFIG.exclude);
  assert.equal(config.rules.indentation.enabled, true);
});

test('ConfigManager 保留默认规则并覆盖指定规则', () => {
  const config = new ConfigManager().mergeWithDefaults({
    format: 'json',
    rules: { naming: { enabled: false, severity: 'info' } },
  });
  assert.equal(config.format, 'json');
  assert.equal(config.rules.naming.enabled, false);
  assert.equal(config.rules.encoding.enabled, true);
});
