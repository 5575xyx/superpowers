import { run } from '../../src/code-style-checker/cli';
import * as fs from 'fs';
import * as path from 'path';

describe('CLI', () => {
  const originalExitCode = process.exitCode;
  const originalLog = console.log;
  const originalError = console.error;
  let logOutput: string[] = [];
  let errorOutput: string[] = [];

  beforeEach(() => {
    process.exitCode = 0;
    logOutput = [];
    errorOutput = [];
    console.log = jest.fn((...args) => logOutput.push(args.join(' ')));
    console.error = jest.fn((...args) => errorOutput.push(args.join(' ')));
  });

  afterEach(() => {
    process.exitCode = originalExitCode;
    console.log = originalLog;
    console.error = originalError;
  });

  describe('help command', () => {
    it('should show help message', async () => {
      await run(['help']);

      expect(logOutput[0]).toContain('Code Style Checker');
      expect(logOutput[0]).toContain('Usage:');
      expect(logOutput[0]).toContain('Commands:');
    });
  });

  describe('version command', () => {
    it('should show version', async () => {
      await run(['version']);

      expect(logOutput[0]).toContain('Code Style Checker');
      expect(logOutput[0]).toMatch(/v\d+\.\d+\.\d+/);
    });
  });

  describe('list command', () => {
    it('should list available rules', async () => {
      await run(['list']);

      expect(logOutput[0]).toContain('Available rules:');
      expect(logOutput[0]).toContain('indentation');
      expect(logOutput[0]).toContain('naming');
    });
  });

  describe('init command', () => {
    it('should create config file', async () => {
      const testDir = path.join(__dirname, 'cli-fixture');
      const originalCwd = process.cwd();

      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      process.chdir(testDir);

      try {
        await run(['init']);

        const configPath = path.join(testDir, '.code-style.json');
        expect(fs.existsSync(configPath)).toBe(true);

        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        expect(config.rules).toBeDefined();
      } finally {
        process.chdir(originalCwd);
        if (fs.existsSync(testDir)) {
          fs.rmSync(testDir, { recursive: true });
        }
      }
    });
  });

  describe('scan command', () => {
    it('should scan directory', async () => {
      const testDir = path.join(__dirname, 'scan-fixture');
      const originalCwd = process.cwd();

      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      fs.writeFileSync(path.join(testDir, 'test.ts'), 'const myVar = 1;\n');
      process.chdir(testDir);

      try {
        await run(['scan']);

        expect(logOutput[0]).toContain('Code Style Checker');
        expect(logOutput[0]).toContain('Files:');
      } finally {
        process.chdir(originalCwd);
        if (fs.existsSync(testDir)) {
          fs.rmSync(testDir, { recursive: true });
        }
      }
    });
  });
});