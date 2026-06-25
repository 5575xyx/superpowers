import { ScanResult, Issue } from '../../src/code-style-checker/types';
import { formatJson, formatMarkdown, formatTerminal } from '../../src/code-style-checker/reporter/formatters';

describe('Report Formatters', () => {
  const mockIssues: Issue[] = [
    {
      file: 'src/test.ts',
      line: 5,
      column: 10,
      rule: 'line-length',
      severity: 'warning',
      message: '行长度超过120字符',
      suggestion: '拆分过长的行',
    },
    {
      file: 'src/test.ts',
      line: 10,
      column: 1,
      rule: 'trailing-space',
      severity: 'warning',
      message: '行尾有多余空格',
    },
  ];

  const mockResult: ScanResult = {
    files: 1,
    issues: mockIssues,
    summary: {
      error: 0,
      warning: 2,
      info: 0,
    },
    time: 100,
  };

  describe('formatJson', () => {
    it('should return valid JSON', () => {
      const output = formatJson(mockResult);
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('should contain all result fields', () => {
      const output = formatJson(mockResult);
      const parsed = JSON.parse(output);

      expect(parsed.files).toBe(1);
      expect(parsed.issues.length).toBe(2);
      expect(parsed.summary.warning).toBe(2);
    });
  });

  describe('formatMarkdown', () => {
    it('should contain summary section', () => {
      const output = formatMarkdown(mockResult);
      expect(output).toContain('Summary');
      expect(output).toContain('Files scanned: 1');
      expect(output).toContain('Warnings: 2');
    });

    it('should contain issues table', () => {
      const output = formatMarkdown(mockResult);
      expect(output).toContain('Issues');
      expect(output).toContain('src/test.ts');
      expect(output).toContain('line-length');
    });

    it('should show "No issues found" when no issues', () => {
      const result: ScanResult = {
        files: 1,
        issues: [],
        summary: { error: 0, warning: 0, info: 0 },
        time: 50,
      };

      const output = formatMarkdown(result);
      expect(output).toContain('No issues found! ✅');
    });
  });

  describe('formatTerminal', () => {
    it('should contain summary', () => {
      const output = formatTerminal(mockResult);
      expect(output).toContain('Summary:');
      expect(output).toContain('Files: 1');
      expect(output).toContain('Warnings: 2');
    });

    it('should contain issues', () => {
      const output = formatTerminal(mockResult);
      expect(output).toContain('Issues:');
      expect(output).toContain('src/test.ts');
    });

    it('should show "No issues found" when no issues', () => {
      const result: ScanResult = {
        files: 1,
        issues: [],
        summary: { error: 0, warning: 0, info: 0 },
        time: 50,
      };

      const output = formatTerminal(result);
      expect(output).toContain('No issues found!');
    });
  });
});