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

    it('should override exclude with provided config', () => {
      const manager = new ConfigManager();
      const config = manager.mergeWithDefaults({
        exclude: ['vendor', '.tmp'],
      });

      expect(config.exclude).toEqual(['vendor', '.tmp']);
    });

    it('should override format with provided config', () => {
      const manager = new ConfigManager();
      const config = manager.mergeWithDefaults({
        format: 'json',
      });

      expect(config.format).toBe('json');
    });
  });

  describe('getRuleConfig', () => {
    it('should return default config for existing rule', () => {
      const manager = new ConfigManager();
      const config = manager.getRuleConfig('indentation');

      expect(config.enabled).toBe(true);
      expect(config.severity).toBe('error');
    });

    it('should return default config for unknown rule', () => {
      const manager = new ConfigManager();
      const config = manager.getRuleConfig('unknown-rule');

      expect(config.enabled).toBe(true);
      expect(config.severity).toBe('warning');
    });
  });
});