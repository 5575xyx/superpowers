import { Issue, ScanResult, Config } from '../types';
import { getAdapterForFile } from '../adapters';
import { ConfigManager, DEFAULT_CONFIG } from '../config';
import * as fs from 'fs';
import * as path from 'path';

export class RuleEngine {
  private config: Config;

  constructor(config?: Config) {
    this.config = config || DEFAULT_CONFIG;
  }

  async scan(directory: string): Promise<ScanResult> {
    const startTime = Date.now();
    const issues: Issue[] = [];
    const scannedFiles: Set<string> = new Set();

    const excludePatterns = this.config.exclude.map((e) => new RegExp(e));

    const shouldExclude = (filePath: string): boolean => {
      const relPath = path.relative(directory, filePath);
      return excludePatterns.some((p) => p.test(relPath));
    };

    const scanDir = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (shouldExclude(fullPath)) {
          continue;
        }

        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile()) {
          const adapter = getAdapterForFile(fullPath);
          if (adapter) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              const fileIssues = adapter.getRules().flatMap((rule) => {
                const ruleConfig = this.config.rules[rule.name];
                if (!ruleConfig || !ruleConfig.enabled) {
                  return [];
                }
                const ruleIssues = rule.check(content, fullPath);
                return ruleIssues.map((issue) => ({
                  ...issue,
                  severity: ruleConfig.severity,
                }));
              });
              issues.push(...fileIssues);
              scannedFiles.add(fullPath);
            } catch (err) {
              console.warn(`Warning: Failed to read file ${fullPath}: ${err}`);
            }
          }
        }
      }
    };

    scanDir(directory);

    const summary = {
      error: issues.filter((i) => i.severity === 'error').length,
      warning: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
    };

    return {
      files: scannedFiles.size,
      issues,
      summary,
      time: Date.now() - startTime,
    };
  }

  async scanFiles(files: string[]): Promise<ScanResult> {
    const startTime = Date.now();
    const issues: Issue[] = [];

    for (const filePath of files) {
      const adapter = getAdapterForFile(filePath);
      if (adapter) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const fileIssues = adapter.getRules().flatMap((rule) => {
            const ruleConfig = this.config.rules[rule.name];
            if (!ruleConfig || !ruleConfig.enabled) {
              return [];
            }
            const ruleIssues = rule.check(content, filePath);
            return ruleIssues.map((issue) => ({
              ...issue,
              severity: ruleConfig.severity,
            }));
          });
          issues.push(...fileIssues);
        } catch (err) {
          console.warn(`Warning: Failed to read file ${filePath}: ${err}`);
        }
      }
    }

    const summary = {
      error: issues.filter((i) => i.severity === 'error').length,
      warning: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
    };

    return {
      files: files.length,
      issues,
      summary,
      time: Date.now() - startTime,
    };
  }
}