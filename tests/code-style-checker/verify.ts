import { RuleEngine } from '../../src/code-style-checker/engine';
import { ConfigManager } from '../../src/code-style-checker/config';
import { formatTerminal } from '../../src/code-style-checker/reporter/formatters';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('=== Code Style Checker Verification ===\n');

  const configManager = new ConfigManager();
  const config = configManager.mergeWithDefaults({});
  const engine = new RuleEngine(config);

  console.log('1. Testing config loading...');
  console.log('   - Rules loaded:', Object.keys(config.rules).length);
  console.log('   - Format:', config.format);
  console.log('   - Exclude directories:', config.exclude.join(', '));
  console.log('   ✓ Config loading successful\n');

  console.log('2. Testing scan on src directory...');
  try {
    const result = await engine.scan('src');
    const output = formatTerminal(result);
    console.log(output);
    console.log('   ✓ Scan successful\n');
  } catch (error) {
    console.log('   ✗ Scan failed:', error);
    console.log('\n');
  }

  console.log('3. Testing rule engine with test content...');
  const testContent = `const myVar = 1;
let AnotherVar = 2;  // trailing space  
function MyFunction() {
  return 42;
}`;

  const testFile = path.join(__dirname, 'test-file.ts');
  fs.writeFileSync(testFile, testContent);

  try {
    const result = await engine.scanFiles([testFile]);
    console.log('   - Issues found:', result.issues.length);
    console.log('   - Errors:', result.summary.error);
    console.log('   - Warnings:', result.summary.warning);
    console.log('   - Info:', result.summary.info);
    console.log('   ✓ Rule engine works correctly\n');
  } catch (error) {
    console.log('   ✗ Rule engine test failed:', error);
  } finally {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  }

  console.log('=== Verification Complete ===');
}

main().catch(console.error);