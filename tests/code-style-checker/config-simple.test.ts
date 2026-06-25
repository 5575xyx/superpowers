import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ConfigManager, DEFAULT_CONFIG } from '../src/code-style-checker/config';

describe('ConfigManager', () => {
  describe('mergeWithDefaults', () => {
    it('should return default config when no config provided', () => {
      const manager = new ConfigManager();
      const config = manager.mergeWithDefaults({});

      expect(config.rules).toEqual(DEFAULT_CONFIG.rules);
      expect(config.exclude).toEqual(DEFAULT_CONFIG.exclude);
      expect(config.format).toEqual(DEFAULT_CONFIG.format);
    });

    it('should override rules with provided config', () => {
      const manager = new ConfigManager();
      const config = manager.mergeWithDefaults({
        rules: {
          indentation: { enabled: false, severity: 'warning' },
        },
      });

      expect(config.rules.indentation.enabled).toBe(false);
      expect(config.rules.indentation.severity).toBe('warning');
    });
  });
});