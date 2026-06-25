import { RuleEngine } from '../../src/code-style-checker/engine';
import { ConfigManager } from '../../src/code-style-checker/config';
import * as fs from 'fs';
import * as path from 'path';

describe('RuleEngine', () => {
  const testDir = path.join(__dirname, 'fixtures');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('scan', () => {
    it('should scan directory and find issues', async () => {
      const testFile = path.join(testDir, 'test.ts');
      fs.writeFileSync(testFile, 'const myVar = 1;\nlet AnotherVar = 2;\n');

      const configManager = new ConfigManager();
      const config = configManager.mergeWithDefaults({});
      const engine = new RuleEngine(config);
      const result = await engine.scan(testDir);

      expect(result.files).toBe(1);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should exclude specified directories', async () => {
      const excludeDir = path.join(testDir, 'node_modules');
      fs.mkdirSync(excludeDir, { recursive: true });
      fs.writeFileSync(path.join(excludeDir, 'vendor.js'), 'const x = 1;\n');
      fs.writeFileSync(path.join(testDir, 'src.ts'), 'const y = 2;\n');

      const configManager = new ConfigManager();
      const config = configManager.mergeWithDefaults({
        exclude: ['node_modules'],
      });
      const engine = new RuleEngine(config);
      const result = await engine.scan(testDir);

      expect(result.files).toBe(1);
      expect(result.issues[0].file).not.toContain('node_modules');
    });

    it('should handle non-existent directory', async () => {
      const engine = new RuleEngine();
      await expect(engine.scan('/non-existent-directory')).rejects.toThrow();
    });
  });

  describe('scanFiles', () => {
    it('should scan single file', async () => {
      const testFile = path.join(testDir, 'test.ts');
      fs.writeFileSync(testFile, 'const myVar = 1;\n');

      const engine = new RuleEngine();
      const result = await engine.scanFiles([testFile]);

      expect(result.files).toBe(1);
    });

    it('should scan multiple files', async () => {
      const file1 = path.join(testDir, 'file1.ts');
      const file2 = path.join(testDir, 'file2.ts');
      fs.writeFileSync(file1, 'const x = 1;\n');
      fs.writeFileSync(file2, 'const y = 2;\n');

      const engine = new RuleEngine();
      const result = await engine.scanFiles([file1, file2]);

      expect(result.files).toBe(2);
    });
  });
});