import { Config, RuleConfig } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export const DEFAULT_CONFIG: Config = {
  rules: {
    indentation: {
      enabled: true,
      severity: 'error',
      options: { type: 'spaces', width: 2 },
    },
    'trailing-space': {
      enabled: true,
      severity: 'warning',
    },
    'empty-lines': {
      enabled: true,
      severity: 'warning',
    },
    'line-length': {
      enabled: true,
      severity: 'warning',
      options: { max: 120 },
    },
    naming: {
      enabled: true,
      severity: 'warning',
      options: { variableStyle: 'camelCase', functionStyle: 'camelCase' },
    },
    encoding: {
      enabled: true,
      severity: 'error',
    },
    'eof-newline': {
      enabled: true,
      severity: 'warning',
    },
    comments: {
      enabled: true,
      severity: 'info',
    },
    imports: {
      enabled: true,
      severity: 'warning',
    },
  },
  exclude: ['node_modules', '.git', 'dist', 'build'],
  include: [],
  format: 'terminal',
};

export class ConfigManager {
  load(configPath?: string): Config {
    const config: Partial<Config> = {};

    if (configPath) {
      try {
        const resolvedPath = path.resolve(configPath);
        if (fs.existsSync(resolvedPath)) {
          const content = fs.readFileSync(resolvedPath, 'utf-8');
          Object.assign(config, JSON.parse(content));
        }
      } catch {
        console.warn('Warning: Failed to load config file, using defaults');
      }
    }

    return this.mergeWithDefaults(config);
  }

  mergeWithDefaults(config: Partial<Config>): Config {
    return {
      rules: {
        ...DEFAULT_CONFIG.rules,
        ...config.rules,
      },
      exclude: config.exclude ?? DEFAULT_CONFIG.exclude,
      include: config.include ?? DEFAULT_CONFIG.include,
      format: config.format ?? DEFAULT_CONFIG.format,
    };
  }

  getRuleConfig(ruleName: string): RuleConfig {
    return DEFAULT_CONFIG.rules[ruleName] || {
      enabled: true,
      severity: 'warning',
    };
  }
}