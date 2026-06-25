import { ScanResult } from '../types';

export function formatJson(result: ScanResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatMarkdown(result: ScanResult): string {
  let md = `# Code Style Checker Report\n\n`;
  md += `## Summary\n\n`;
  md += `- Files scanned: ${result.files}\n`;
  md += `- Errors: ${result.summary.error}\n`;
  md += `- Warnings: ${result.summary.warning}\n`;
  md += `- Info: ${result.summary.info}\n`;
  md += `- Time: ${(result.time / 1000).toFixed(2)}s\n\n`;

  if (result.issues.length > 0) {
    md += `## Issues\n\n`;
    md += `| File | Line | Column | Severity | Rule | Message |\n`;
    md += `|------|------|--------|----------|------|----------|\n`;

    for (const issue of result.issues) {
      md += `| ${issue.file} | ${issue.line} | ${issue.column} | ${issue.severity} | ${issue.rule} | ${issue.message} |\n`;
    }
  } else {
    md += `## Issues\n\nNo issues found! ✅\n`;
  }

  return md;
}

export function formatTerminal(result: ScanResult): string {
  const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    bold: '\x1b[1m',
  };

  let output = `${colors.bold}Code Style Checker${colors.reset}\n\n`;
  output += `${colors.cyan}Summary:${colors.reset}\n`;
  output += `  Files: ${result.files}\n`;
  output += `  Errors: ${colors.red}${result.summary.error}${colors.reset}\n`;
  output += `  Warnings: ${colors.yellow}${result.summary.warning}${colors.reset}\n`;
  output += `  Info: ${colors.cyan}${result.summary.info}${colors.reset}\n`;
  output += `  Time: ${(result.time / 1000).toFixed(2)}s\n\n`;

  if (result.issues.length > 0) {
    output += `${colors.bold}Issues:${colors.reset}\n\n`;

    const errors = result.issues.filter((i) => i.severity === 'error');
    const warnings = result.issues.filter((i) => i.severity === 'warning');
    const info = result.issues.filter((i) => i.severity === 'info');

    if (errors.length > 0) {
      output += `${colors.red}Errors:${colors.reset}\n`;
      for (const issue of errors) {
        output += `  ${issue.file}:${issue.line}:${issue.column} - ${issue.message}\n`;
      }
      output += '\n';
    }

    if (warnings.length > 0) {
      output += `${colors.yellow}Warnings:${colors.reset}\n`;
      for (const issue of warnings) {
        output += `  ${issue.file}:${issue.line}:${issue.column} - ${issue.message}\n`;
      }
      output += '\n';
    }

    if (info.length > 0) {
      output += `${colors.cyan}Info:${colors.reset}\n`;
      for (const issue of info) {
        output += `  ${issue.file}:${issue.line}:${issue.column} - ${issue.message}\n`;
      }
    }
  } else {
    output += `${colors.green}No issues found! ✅${colors.reset}\n`;
  }

  return output;
}