export type Severity = 'error' | 'warning' | 'info';

export interface RuleConfig {
  enabled: boolean;
  severity: Severity;
  options?: Record<string, unknown>;
}

export interface Config {
  rules: Record<string, RuleConfig>;
  exclude: string[];
  include: string[];
  format: 'json' | 'markdown' | 'terminal';
}

export interface Issue {
  file: string;
  line: number;
  column: number;
  rule: string;
  severity: Severity;
  message: string;
  suggestion?: string;
}

export interface ScanResult {
  files: number;
  issues: Issue[];
  summary: {
    error: number;
    warning: number;
    info: number;
  };
  time: number;
}

export interface Rule {
  name: string;
  description: string;
  check(content: string, fileName: string): Issue[];
}

export interface LanguageAdapter {
  name: string;
  extensions: string[];
  detect(filePath: string): boolean;
  getRules(): Rule[];
}