import { RuleEngine } from '../engine';
import { ConfigManager } from '../config';
import { formatJson, formatMarkdown, formatTerminal } from '../reporter/formatters';
import * as fs from 'fs';
import * as path from 'path';

const VERSION = '1.0.0';

interface CliArgs {
  command: string;
  dir?: string;
  config?: string;
  format?: string;
  exclude?: string;
  file?: string;
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = { command: args[0] || 'help' };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.split('=');
      switch (key) {
        case '--dir':
          result.dir = value || args[++i];
          break;
        case '--config':
          result.config = value || args[++i];
          break;
        case '--format':
          result.format = value || args[++i];
          break;
        case '--exclude':
          result.exclude = value || args[++i];
          break;
        case '--file':
          result.file = value || args[++i];
          break;
      }
    }
  }

  return result;
}

function showHelp(): void {
  console.log(`Code Style Checker v${VERSION}

Usage:
  code-style-checker <command> [options]

Commands:
  scan     Scan a directory for code style issues
  check    Check a single file
  init     Initialize configuration file
  list     List available rules
  version  Show version information
  help     Show this help message

Options:
  --dir     Directory to scan (default: current directory)
  --config  Path to configuration file
  --format  Output format: json, markdown, terminal (default: terminal)
  --exclude Comma-separated list of directories to exclude
  --file    File to check

Examples:
  code-style-checker scan
  code-style-checker scan --dir src --format json
  code-style-checker check --file src/index.ts
  code-style-checker init -f`);
}

function showVersion(): void {
  console.log(`Code Style Checker v${VERSION}`);
}

function listRules(): void {
  const rules = [
    { name: 'indentation', description: '检查代码缩进' },
    { name: 'trailing-space', description: '检查行尾空格' },
    { name: 'empty-lines', description: '检查空行数量' },
    { name: 'line-length', description: '检查行长度' },
    { name: 'naming', description: '检查命名风格' },
    { name: 'encoding', description: '检查文件编码' },
    { name: 'eof-newline', description: '检查文件末尾换行' },
    { name: 'comments', description: '检查注释风格' },
    { name: 'imports', description: '检查 import 排序' },
  ];

  console.log('Available rules:\n');
  for (const rule of rules) {
    console.log(`  ${rule.name}: ${rule.description}`);
  }
}

function initConfig(): void {
  const config = {
    rules: {
      indentation: { enabled: true, severity: 'error' },
      'trailing-space': { enabled: true, severity: 'warning' },
      'empty-lines': { enabled: true, severity: 'warning' },
      'line-length': { enabled: true, severity: 'warning' },
      naming: { enabled: true, severity: 'warning' },
      encoding: { enabled: true, severity: 'error' },
      'eof-newline': { enabled: true, severity: 'warning' },
      comments: { enabled: true, severity: 'info' },
      imports: { enabled: true, severity: 'warning' },
    },
    exclude: ['node_modules', '.git', 'dist'],
    include: [],
    format: 'terminal',
  };

  fs.writeFileSync(path.join(process.cwd(), '.code-style.json'), JSON.stringify(config, null, 2));
  console.log('Configuration file created: .code-style.json');
}

export async function run(args: string[]): Promise<void> {
  const parsed = parseArgs(args);

  switch (parsed.command) {
    case 'scan': {
      const configManager = new ConfigManager();
      const config = configManager.load(parsed.config);

      if (parsed.exclude) {
        config.exclude = parsed.exclude.split(',');
      }

      const engine = new RuleEngine(config);
      const result = await engine.scan(parsed.dir || process.cwd());

      const format = parsed.format || config.format || 'terminal';
      let output = '';
      switch (format) {
        case 'json':
          output = formatJson(result);
          break;
        case 'markdown':
          output = formatMarkdown(result);
          break;
        default:
          output = formatTerminal(result);
      }

      console.log(output);

      if (result.summary.error > 0) {
        process.exitCode = 1;
      }
      break;
    }

    case 'check': {
      if (!parsed.file) {
        console.error('Error: --file is required for check command');
        process.exitCode = 1;
        return;
      }

      const configManager = new ConfigManager();
      const config = configManager.load(parsed.config);
      const engine = new RuleEngine(config);
      const result = await engine.scanFiles([parsed.file]);

      const format = parsed.format || config.format || 'terminal';
      let output = '';
      switch (format) {
        case 'json':
          output = formatJson(result);
          break;
        case 'markdown':
          output = formatMarkdown(result);
          break;
        default:
          output = formatTerminal(result);
      }

      console.log(output);

      if (result.summary.error > 0) {
        process.exitCode = 1;
      }
      break;
    }

    case 'init':
      initConfig();
      break;

    case 'list':
      listRules();
      break;

    case 'version':
      showVersion();
      break;

    case 'help':
    default:
      showHelp();
      break;
  }
}