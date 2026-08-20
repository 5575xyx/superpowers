import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import test from 'node:test';

const repoRoot = resolve(import.meta.dirname, '..');
const cliPath = join(repoRoot, 'src', 'cli', 'powersnexus-cli.js');
const packageVersion = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')).version;
const projectInputNames = new Set([
  'package.json', 'package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lock', 'bun.lockb',
  'deno.json', 'deno.jsonc', 'deno.lock', 'pyproject.toml', 'poetry.lock', 'uv.lock', 'pipfile', 'pipfile.lock',
  'requirements.txt', 'setup.py', 'setup.cfg', 'tox.ini', 'pom.xml', 'build.gradle', 'build.gradle.kts',
  'settings.gradle', 'settings.gradle.kts', 'gradle.properties', 'go.mod', 'go.sum', 'go.work', 'go.work.sum',
  'cargo.toml', 'cargo.lock', 'global.json', 'directory.build.props', 'directory.build.targets',
  'directory.packages.props', 'packages.lock.json', 'nuget.config', 'gemfile', 'gemfile.lock', 'composer.json',
  'composer.lock', 'package.swift', 'package.resolved', 'pubspec.yaml', 'pubspec.lock', 'dockerfile',
  'docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml', 'makefile', 'justfile',
  'taskfile.yml', 'taskfile.yaml', '.tool-versions', '.nvmrc', '.node-version', '.python-version', 'mise.toml',
  'turbo.json', 'nx.json', 'workspace.json',
]);

function runCli(cwd, ...args) {
  return spawnSync(process.execPath, [cliPath, ...args], { cwd, encoding: 'utf8' });
}

function collectProjectInputFiles(directory, traceabilityFiles) {
  const directories = new Set([directory]);
  for (const file of traceabilityFiles) {
    let current = dirname(join(directory, file));
    while (current !== directory) {
      directories.add(current);
      current = dirname(current);
    }
  }
  const files = [];
  for (const current of directories) {
    for (const fileName of readdirSync(current)) {
      const normalized = fileName.toLowerCase();
      const matches = projectInputNames.has(normalized)
        || /^requirements(?:[-.][^.]+)?\.txt$/i.test(fileName)
        || /\.(?:cs|fs|vb)proj$/i.test(fileName)
        || /\.sln$/i.test(fileName)
        || /^dockerfile\..+/i.test(fileName);
      const filePath = join(current, fileName);
      if (matches && statSync(filePath).isFile()) {
        files.push(relative(directory, filePath).replaceAll('\\', '/'));
      }
    }
  }
  return files;
}

function createDeliveryFingerprint(directory, changeDir, traceabilityFiles) {
  const delivery = JSON.parse(readFileSync(join(changeDir, 'delivery.json'), 'utf8'));
  const deltaSpecsDir = join(changeDir, 'delta-specs');
  const deltaSpecFiles = readdirSync(deltaSpecsDir)
    .map((module) => join(deltaSpecsDir, module, 'spec.md'))
    .filter((specPath) => existsSync(specPath))
    .map((specPath) => relative(directory, specPath).replaceAll('\\', '/'));
  const files = [...new Set([
    ...deltaSpecFiles,
    ...collectProjectInputFiles(directory, traceabilityFiles),
    ...traceabilityFiles,
  ])].sort();
  const requiredSteps = delivery.profile === 'library'
    ? ['build', 'test', 'integration', 'package']
    : delivery.profile === 'document'
      ? []
      : ['build', 'test', 'integration', 'run', 'health'];
  const commands = requiredSteps.map((id) => {
    const step = delivery.steps.find((item) => item.id === id);
    return { id, argv: step.argv, timeoutMs: step.timeoutMs ?? null };
  });
  const environment = { platform: process.platform, arch: process.arch, node: process.version };
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file);
    hash.update('\0');
    hash.update(readFileSync(join(directory, file)));
    hash.update('\0');
  }
  hash.update(JSON.stringify({ profile: delivery.profile, commands, environment }));
  return { algorithm: 'sha256', files, commands, environment, digest: hash.digest('hex') };
}

function updateDeliveryFingerprint(directory, changeDir, files) {
  const deliveryPath = join(changeDir, 'delivery.json');
  const delivery = JSON.parse(readFileSync(deliveryPath, 'utf8'));
  delivery.deliveryFingerprint = createDeliveryFingerprint(directory, changeDir, files);
  writeFileSync(deliveryPath, JSON.stringify(delivery));
}

test('start 支持 --level 覆盖自动评估', () => {
  const result = runCli(repoRoot, 'start', '修复一个小问题', '--level', 'L3');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /推荐级别: L3 - 完整流程/);
  assert.match(result.stdout, /已按 --level L3 覆盖自动评估/);
});

test('start 为 L0 输出直接修改和极低 Token 预算', () => {
  const result = runCli(repoRoot, 'start', '修复一个字');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /推荐级别: L0 - 微型修复/);
  assert.match(result.stdout, /技能激活: 不加载流程技能；只进行直接修改和聚焦验证/);
  assert.match(result.stdout, /Token 预算: 极低/);
});

test('start 优先将核心架构任务识别为 L4', () => {
  const result = runCli(repoRoot, 'start', '进行核心架构升级');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /推荐级别: L4 - 重量级/);
  assert.match(result.stdout, /Token 预算: 高（以风险控制为优先）/);
});

test('start 拒绝非法 --level', () => {
  const result = runCli(repoRoot, 'start', '任意任务', '--level', 'L9');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--level 仅支持 L0、L1、L2、L3 或 L4/);
});

test('帮助信息声明 --level 参数', () => {
  const result = runCli(repoRoot, 'help');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /start <task-description> \[--level L0-L4\]/);
});

test('doctor 验证当前安装包的清单、运行时入口和关键技能', () => {
  const result = runCli(repoRoot, 'doctor');

  assert.equal(result.status, 0);
  assert.match(result.stdout, new RegExp(`PowersNexus 健康检查 v${packageVersion.replaceAll('.', '\\.')}`));
  assert.match(result.stdout, /OpenCode 插件入口 可用/);
  assert.match(result.stdout, /UI\/UX 设计技能 可用/);
  assert.match(result.stdout, /安装状态正常/);
});

test('帮助信息声明 doctor 命令', () => {
  const result = runCli(repoRoot, 'help');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /doctor\s+安装与运行时健康检查/);
});

test('帮助信息声明 next 命令', () => {
  const result = runCli(repoRoot, 'help');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /next <change-name>\s+根据现有工件建议唯一下一步/);
});

test('帮助信息声明 checkpoint 命令', () => {
  const result = runCli(repoRoot, 'help');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /checkpoint save <change> --task <id> --next <text>/);
  assert.match(result.stdout, /checkpoint list <change>/);
});

test('帮助信息声明交付检查命令', () => {
  const result = runCli(repoRoot, 'help');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /check delivery <change-name>\s+归档前交付门槛检查/);
  assert.match(result.stdout, /verify delivery <change-name>\s+显式执行 delivery\.json 中的本地验证命令/);
  assert.match(result.stdout, /init delivery <change-name> \[--profile application\|library\|web\|document\]/);
});

test('帮助信息声明流程审计命令', () => {
  const result = runCli(repoRoot, 'help');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /audit <change-name>\s+归档前流程执行审计/);
});

test('帮助信息声明 telemetry 命令', () => {
  const result = runCli(repoRoot, 'help');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /telemetry <session-file\.jsonl>\s+只读汇总本地会话的 Token 使用量/);
  assert.match(result.stdout, /telemetry compare <baseline> <candidate>/);
});

test('telemetry 只读汇总 Claude 会话与子代理的真实 Token 用量', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-telemetry-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const sessionPath = join(directory, 'session.jsonl');
  writeFileSync(sessionPath, [
    JSON.stringify({ type: 'assistant', message: { model: 'claude-test', usage: { input_tokens: 120, output_tokens: 30, cache_creation_input_tokens: 10, cache_read_input_tokens: 40 } } }),
    JSON.stringify({ type: 'user', toolUseResult: { agentId: 'agent-1', usage: { input_tokens: 50, output_tokens: 10, cache_creation_input_tokens: 5, cache_read_input_tokens: 15 } } }),
    '{ 无效 JSONL 记录',
  ].join('\n'));

  const result = runCli(directory, 'telemetry', sessionPath);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Token 遥测（仅本地只读）：session\.jsonl/);
  assert.match(result.stdout, /模型标识：claude-test/);
  assert.match(result.stdout, /主会话：1 条计量消息，输入 120，输出 30/);
  assert.match(result.stdout, /子代理：1 个，1 条计量消息/);
  assert.match(result.stdout, /缓存：创建 15，读取 55/);
  assert.match(result.stdout, /合计：消息 2，总输入（含缓存） 240，输出 40，总 Token 280/);
  assert.match(result.stdout, /已忽略 1 条无法解析的 JSONL 记录/);
  assert.equal(readdirSync(directory).join(','), 'session.jsonl');
});

test('telemetry 拒绝缺少参数、缺失文件和带 BOM 的会话', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-telemetry-error-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const bomSessionPath = join(directory, 'bom-session.jsonl');
  writeFileSync(bomSessionPath, `\uFEFF${JSON.stringify({ type: 'assistant', message: { usage: {} } })}`);

  const noArgument = runCli(directory, 'telemetry');
  const missingFile = runCli(directory, 'telemetry', join(directory, 'missing.jsonl'));
  const bomFile = runCli(directory, 'telemetry', bomSessionPath);

  assert.equal(noArgument.status, 1);
  assert.match(noArgument.stderr, /telemetry 需要 <会话文件\.jsonl> 参数/);
  assert.equal(missingFile.status, 1);
  assert.match(missingFile.stderr, /会话文件不存在/);
  assert.equal(bomFile.status, 1);
  assert.match(bomFile.stderr, /包含 UTF-8 BOM/);
});

test('telemetry compare 显式对比两份真实会话的 Token 差异且不写入文件', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-telemetry-compare-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const baselinePath = join(directory, 'baseline.jsonl');
  const candidatePath = join(directory, 'candidate.jsonl');
  writeFileSync(baselinePath, JSON.stringify({ type: 'assistant', message: { model: 'claude-baseline', usage: { input_tokens: 600, output_tokens: 100, cache_creation_input_tokens: 100, cache_read_input_tokens: 200 } } }));
  writeFileSync(candidatePath, JSON.stringify({ type: 'assistant', message: { model: 'claude-candidate', usage: { input_tokens: 450, output_tokens: 100, cache_creation_input_tokens: 50, cache_read_input_tokens: 150 } } }));

  const result = runCli(directory, 'telemetry', 'compare', baselinePath, candidatePath);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Token 遥测对比（仅本地只读）/);
  assert.match(result.stdout, /总 Token：1,000 → 750（减少 250（-25\.0%））/);
  assert.match(result.stdout, /总输入（含缓存）：900 → 650（减少 250（-27\.8%））/);
  assert.match(result.stdout, /模型标识：基线 claude-baseline；候选 claude-candidate/);
  assert.match(result.stdout, /检测到模型标识不同；Token 差异不能单独归因于流程改动/);
  assert.match(result.stdout, /任务范围、模型、工具配置和完成标准一致/);
  assert.equal(readdirSync(directory).sort().join(','), 'baseline.jsonl,candidate.jsonl');
});

test('telemetry compare 拒绝缺少候选会话并处理零基线比例', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-telemetry-compare-edge-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const baselinePath = join(directory, 'baseline.jsonl');
  const candidatePath = join(directory, 'candidate.jsonl');
  writeFileSync(baselinePath, JSON.stringify({ type: 'assistant', message: { usage: {} } }));
  writeFileSync(candidatePath, JSON.stringify({ type: 'assistant', message: { usage: { output_tokens: 1 } } }));

  const missingCandidate = runCli(directory, 'telemetry', 'compare', baselinePath);
  const zeroBaseline = runCli(directory, 'telemetry', 'compare', baselinePath, candidatePath);

  assert.equal(missingCandidate.status, 1);
  assert.match(missingCandidate.stderr, /需要 <基线会话\.jsonl> 和 <候选会话\.jsonl> 参数/);
  assert.equal(zeroBaseline.status, 0);
  assert.match(zeroBaseline.stdout, /基线为 0，无法计算比例/);
});

test('next 为缺少 Delta Spec 的变更建议创建规格', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-next-spec-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = join(directory, '.novaway', 'powersnexus', 'changes', 'example');
  mkdirSync(changeDir, { recursive: true });
  writeFileSync(join(changeDir, 'proposal.md'), '创建模式：Greenfield\n');

  const result = runCli(directory, 'next', 'example');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /创建至少一个 delta-specs/);
});

test('next 为完整规划但缺少追踪表的变更建议 trace', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-next-trace-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = join(directory, '.novaway', 'powersnexus', 'changes', 'example');
  const deltaDir = join(changeDir, 'delta-specs', 'module-a');
  mkdirSync(deltaDir, { recursive: true });
  writeFileSync(join(changeDir, 'proposal.md'), 'REQ-101\n');
  writeFileSync(join(changeDir, 'design.md'), 'REQ-101\n');
  writeFileSync(join(changeDir, 'tasks.md'), '- [x] 实现 REQ-101\n');
  writeFileSync(join(changeDir, 'cross-reference.md'), 'REQ-101\n');
  writeFileSync(join(deltaDir, 'spec.md'), 'REQ-101\n');

  const result = runCli(directory, 'next', 'example');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /生成需求追踪表/);
  assert.match(result.stdout, /powersnexus trace example/);
});

test('next 在任务完成且存在追踪表时建议一致性检查和归档', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-next-archive-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  createDeliverableChange(directory);

  const result = runCli(directory, 'next', 'example');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /运行流程审计和交付检查；通过后归档变更/);
  assert.match(result.stdout, /powersnexus audit example && powersnexus check delivery example && powersnexus archive example/);
});

test('next 在交付输入变化后建议重新执行交付验证', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-next-expired-delivery-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  createDeliverableChange(directory);
  writeFileSync(join(directory, 'src', 'example.js'), 'export const example = false;\n');

  const result = runCli(directory, 'next', 'example');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /交付输入已变化，重新执行本地验证以刷新证据/);
  assert.match(result.stdout, /powersnexus verify delivery example/);
});

test('audit 通过合规变更（声明级别与信号匹配且证据齐全）', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-audit-pass-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  createDeliverableChange(directory);

  const result = runCli(directory, 'audit', 'example');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /流程执行审计通过/);
  assert.match(result.stdout, /声明级别 L2 不低于推断级别/);
});

test('audit 拒绝缺少流程合规声明的变更', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-audit-no-declaration-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  rmSync(join(changeDir, 'process-declaration.md'));

  const result = runCli(directory, 'audit', 'example');

  assert.equal(result.status, 1);
  assert.match(result.stdout, /缺少 process-declaration\.md 流程合规声明/);
});

test('audit 拒绝声明级别低于信号推断级别的变更', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-audit-low-level-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  writeFileSync(join(changeDir, 'process-declaration.md'), '声明级别: L0\n遵循步骤: 直接修改\n跳过步骤及理由: 无\n审查记录: 无\n');
  writeFileSync(join(directory, 'src', 'example.js'), Array(60).fill('export const x = 1;').join('\n') + '\n');
  updateDeliveryFingerprint(directory, changeDir, ['src/example.js', 'tests/example.test.js']);

  const result = runCli(directory, 'audit', 'example');

  assert.equal(result.status, 1);
  assert.match(result.stdout, /级别路由不符/);
  assert.match(result.stdout, /声明 L0 低于推断最低级别/);
});

test('audit 拒绝 L2 及以上缺少审查证据的变更', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-audit-no-review-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  rmSync(join(changeDir, 'code-red-team-review.md'));
  writeFileSync(join(changeDir, 'process-declaration.md'), '声明级别: L3\n遵循步骤: 完整流程\n跳过步骤及理由: 无\n');

  const result = runCli(directory, 'audit', 'example');

  assert.equal(result.status, 1);
  assert.match(result.stdout, /需要审查记录/);
});

test('audit 拒绝变更目录不存在的审计请求', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-audit-missing-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));

  const result = runCli(directory, 'audit', 'nonexistent');

  assert.equal(result.status, 1);
  assert.match(result.stderr, /变更目录不存在/);
});

test('audit 对 document 变更不计实现文件行数推断级别', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-audit-document-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);

  // 模拟 document 交付：profile 为 document，无执行步骤
  writeFileSync(join(changeDir, 'delivery.json'), `${JSON.stringify({
    profile: 'document',
    verifiedAt: '2026-07-15T00:00:00.000Z',
    steps: [],
  }, null, 2)}\n`);
  // 实现文件行数虚高（如被修改的大文档），但实际改动小、声明 L2
  writeFileSync(join(directory, 'src', 'example.js'), Array(1200).fill('export const x = 1;').join('\n') + '\n');
  writeFileSync(join(changeDir, 'traceability.md'), '| REQ-ID | 模块 | 代码实现 | 测试覆盖 | 状态 |\n| REQ-101 | module-a | src/example.js | tests/example.test.js | ✅ 完成 |\n');
  updateDeliveryFingerprint(directory, changeDir, ['src/example.js', 'tests/example.test.js']);

  const result = runCli(directory, 'audit', 'example');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /document 变更，不计实现文件行数/);
  assert.match(result.stdout, /声明级别 L2 不低于推断级别/);
  assert.match(result.stdout, /流程执行审计通过/);
});

function createDeliverableChange(directory, name = 'example') {
  const changeDir = join(directory, '.novaway', 'powersnexus', 'changes', name);
  const deltaDir = join(changeDir, 'delta-specs', 'module-a');
  mkdirSync(deltaDir, { recursive: true });
  mkdirSync(join(directory, 'src'), { recursive: true });
  mkdirSync(join(directory, 'tests'), { recursive: true });
  writeFileSync(join(directory, 'src', 'example.js'), 'export const example = true;\n');
  writeFileSync(join(directory, 'tests', 'example.test.js'), 'export const exampleTest = true;\n');
  writeFileSync(join(directory, 'src', 'a.js'), 'export const a = true;\n');
  writeFileSync(join(directory, 'tests', 'a.test.js'), 'export const aTest = true;\n');
  writeFileSync(join(directory, 'src', 'b.js'), 'export const b = true;\n');
  writeFileSync(join(directory, 'tests', 'b.test.js'), 'export const bTest = true;\n');
  writeFileSync(join(changeDir, 'proposal.md'), '创建模式：Greenfield（首次创建）\nREQ-101\n');
  writeFileSync(join(changeDir, 'design.md'), 'REQ-101\n');
  writeFileSync(join(changeDir, 'tasks.md'), '- [x] 实现并验证 REQ-101\n');
  writeFileSync(join(changeDir, 'cross-reference.md'), 'REQ-101\n');
  writeFileSync(join(deltaDir, 'spec.md'), '## ADDED Requirements\nREQ-101\n');
  writeFileSync(join(changeDir, 'traceability.md'), '| REQ-ID | 模块 | 代码实现 | 测试覆盖 | 状态 |\n| REQ-101 | module-a | src/example.js | tests/example.test.js | ✅ 完成 |\n');
  writeFileSync(join(changeDir, 'process-declaration.md'), '声明级别: L2\n遵循步骤: 设计契约 → 计划 → 实现 → 测试 → 审查\n跳过步骤及理由: 无\n审查记录: 已完成代码专家审查\n');
  writeFileSync(join(changeDir, 'code-red-team-review.md'), '# 代码红队审查\n\n审查结论：通过\n');
  const executedStep = (id) => ({
    id,
    argv: [process.execPath, '-e', 'process.exit(0)'],
    status: 'passed',
    exitCode: 0,
    executedAt: '2026-07-15T00:00:00.000Z',
  });
  writeFileSync(join(changeDir, 'delivery.json'), `${JSON.stringify({
    profile: 'application',
    verifiedAt: '2026-07-15T00:00:00.000Z',
    steps: [
      executedStep('build'),
      executedStep('test'),
      executedStep('integration'),
      executedStep('run'),
      executedStep('health'),
    ],
  }, null, 2)}\n`);
  updateDeliveryFingerprint(directory, changeDir, ['src/example.js', 'tests/example.test.js']);
  return changeDir;
}

function createBrownfieldMasterSpec(requirements) {
  const requirementBlocks = requirements.map(({ id, statement }) => `#### ${id}: 示例需求 ${id}

**陈述：** ${statement}

---`).join('\n\n');
  return `# Master Specification: module-a

> 版本：v1.0

## Metadata

| 字段 | 内容 |
|------|------|
| **规格版本** | v1.0 |
| **最后更新** | 2026-07-01 |

---

## 2. 功能规格

### 2.2 详细需求

${requirementBlocks}

## 3. 非功能性需求

无

---

## 6. 变更历史

| 版本 | 日期 | 变更类型 | 变更说明 | 关联变更 |
|------|------|----------|----------|----------|
| v1.0 | 2026-07-01 | INITIAL | 初始需求 | initial |

---

## 7. 术语表

无

**文档版本：** v1.0
**最后更新：** 2026-07-01
`;
}

test('check consistency 拒绝缺少 Delta Spec 的规划工件', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-consistency-no-delta-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = join(directory, '.novaway', 'powersnexus', 'changes', 'example');
  mkdirSync(changeDir, { recursive: true });
  writeFileSync(join(changeDir, 'proposal.md'), 'REQ-101\n');
  writeFileSync(join(changeDir, 'design.md'), 'REQ-101\n');
  writeFileSync(join(changeDir, 'tasks.md'), '- [ ] 实现 REQ-101\n');
  writeFileSync(join(changeDir, 'cross-reference.md'), 'REQ-101\n');

  const result = runCli(directory, 'check', 'consistency', 'example');

  assert.equal(result.status, 1);
  assert.match(result.stdout, /未找到 delta-specs/);
});

test('check delivery 要求任务、追踪和完整的本地交付证明', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-fail-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  writeFileSync(join(changeDir, 'tasks.md'), '- [ ] 实现并验证 REQ-101\n');
  writeFileSync(join(changeDir, 'traceability.md'), '| REQ-101 | module-a | 待实现 | 待测试 | ⏳ 待开始 |\n');
  writeFileSync(join(changeDir, 'delivery.json'), JSON.stringify({ profile: 'application', verifiedAt: 'not-a-date', steps: [] }));

  const result = runCli(directory, 'check', 'delivery', 'example');

  assert.equal(result.status, 1);
  assert.match(result.stdout, /存在 1 项未完成任务/);
  assert.match(result.stdout, /REQ-101 缺少代码实现路径/);
  assert.match(result.stdout, /REQ-101 缺少测试覆盖路径/);
  assert.match(result.stdout, /REQ-101 状态未标记为完成/);
  assert.match(result.stdout, /verifiedAt 必须是有效的 ISO 时间/);
  assert.match(result.stdout, /缺少 build 验证步骤/);
});

test('init delivery 创建 application 交付契约且不覆盖已有文件', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-init-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = join(directory, '.novaway', 'powersnexus', 'changes', 'example');
  mkdirSync(changeDir, { recursive: true });

  const initialized = runCli(directory, 'init', 'delivery', 'example', '--profile', 'application');

  assert.equal(initialized.status, 0);
  assert.match(initialized.stdout, /已初始化 application 交付契约/);
  const deliveryPath = join(changeDir, 'delivery.json');
  const delivery = JSON.parse(readFileSync(deliveryPath, 'utf8'));
  assert.equal(delivery.profile, 'application');
  assert.deepEqual(delivery.steps.map((step) => step.id), ['build', 'test', 'integration', 'run', 'health']);
  assert.equal(delivery.steps.every((step) => step.status === 'pending' && step.argv[0] === 'REPLACE_EXECUTABLE'), true);

  const duplicate = runCli(directory, 'init', 'delivery', 'example');
  assert.equal(duplicate.status, 1);
  assert.match(duplicate.stderr, /delivery\.json 已存在，拒绝覆盖/);
  assert.deepEqual(JSON.parse(readFileSync(deliveryPath, 'utf8')), delivery);
});

test('init delivery 创建 library 交付契约', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-init-library-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = join(directory, '.novaway', 'powersnexus', 'changes', 'example');
  mkdirSync(changeDir, { recursive: true });

  const result = runCli(directory, 'init', 'delivery', 'example', '--profile', 'library');

  assert.equal(result.status, 0);
  const delivery = JSON.parse(readFileSync(join(changeDir, 'delivery.json'), 'utf8'));
  assert.equal(delivery.profile, 'library');
  assert.deepEqual(delivery.steps.map((step) => step.id), ['build', 'test', 'integration', 'package']);
});

test('init delivery 创建 document 交付契约（非编码，无构建命令）', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-init-document-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = join(directory, '.novaway', 'powersnexus', 'changes', 'example');
  mkdirSync(changeDir, { recursive: true });

  const result = runCli(directory, 'init', 'delivery', 'example', '--profile', 'document');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /已初始化 document 交付契约/);
  const delivery = JSON.parse(readFileSync(join(changeDir, 'delivery.json'), 'utf8'));
  assert.equal(delivery.profile, 'document');
  assert.deepEqual(delivery.steps, []);
});

test('init delivery 拒绝未知 profile', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-init-unknown-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = join(directory, '.novaway', 'powersnexus', 'changes', 'example');
  mkdirSync(changeDir, { recursive: true });

  const result = runCli(directory, 'init', 'delivery', 'example', '--profile', 'unknown');

  assert.equal(result.status, 1);
  assert.match(result.stderr, /仅支持 application、library、web 或 document/);
});

test('document profile 的 verify/check delivery 以自证通过，不执行任何命令', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-document-pass-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  writeFileSync(join(changeDir, 'delivery.json'), JSON.stringify({ profile: 'document', steps: [] }));
  updateDeliveryFingerprint(directory, changeDir, ['src/example.js', 'tests/example.test.js']);

  const verified = runCli(directory, 'verify', 'delivery', 'example');
  assert.equal(verified.status, 0);
  assert.match(verified.stdout, /所有交付命令已实际通过/);
  const delivery = JSON.parse(readFileSync(join(changeDir, 'delivery.json'), 'utf8'));
  assert.match(delivery.verifiedAt, /^202\d-/);
  assert.deepEqual(delivery.deliveryFingerprint.commands, []);

  const checked = runCli(directory, 'check', 'delivery', 'example');
  assert.equal(checked.status, 0);
  assert.match(checked.stdout, /交付检查通过/);
});

test('start 将非编码任务识别为非编码轨道', () => {
  const result = runCli(repoRoot, 'start', '写一份产品 PRD');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /推荐轨道: 非编码轨道/);
});

test('check delivery 拒绝原样保留在交付模板中的命令占位文本', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-placeholder-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  const deliveryPath = join(changeDir, 'delivery.json');
  const delivery = JSON.parse(readFileSync(deliveryPath, 'utf8'));
  delivery.steps[0].argv = ['替换为真实可执行文件'];
  writeFileSync(deliveryPath, JSON.stringify(delivery));

  const result = runCli(directory, 'check', 'delivery', 'example');

  assert.equal(result.status, 1);
  assert.match(result.stdout, /build 必须提供真实 argv 命令数组/);
});

test('check delivery 将非对象 delivery.json 作为可读错误处理', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-structure-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  writeFileSync(join(changeDir, 'delivery.json'), 'null\n');

  const result = runCli(directory, 'check', 'delivery', 'example');

  assert.equal(result.status, 1);
  assert.match(result.stdout, /delivery.json 根节点必须是对象/);
});

test('check delivery 接受完整的应用交付证明', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-pass-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  createDeliverableChange(directory);

  const result = runCli(directory, 'check', 'delivery', 'example');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /交付检查通过：规划、任务、追踪和交付证明完整/);
});

test('check delivery 要求每个 Delta REQ 都有完成追踪行', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-trace-missing-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  writeFileSync(join(changeDir, 'proposal.md'), '创建模式：Greenfield（首次创建）\nREQ-101\nREQ-102\n');
  writeFileSync(join(changeDir, 'design.md'), 'REQ-101\nREQ-102\n');
  writeFileSync(join(changeDir, 'tasks.md'), '- [x] 实现并验证 REQ-101、REQ-102\n');
  writeFileSync(join(changeDir, 'cross-reference.md'), 'REQ-101\nREQ-102\n');
  writeFileSync(join(changeDir, 'delta-specs', 'module-a', 'spec.md'), '## ADDED Requirements\nREQ-101\nREQ-102\n');

  const result = runCli(directory, 'check', 'delivery', 'example');

  assert.equal(result.status, 1);
  assert.match(result.stdout, /traceability\.md 缺少 REQ-102 完成行/);
});

test('check delivery 拒绝不存在的代码或测试证据路径', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-trace-path-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  writeFileSync(join(changeDir, 'traceability.md'), '| REQ-ID | 模块 | 代码实现 | 测试覆盖 | 状态 |\n| REQ-101 | module-a | src/missing.js | tests/missing.test.js | ✅ 完成 |\n');

  const result = runCli(directory, 'check', 'delivery', 'example');

  assert.equal(result.status, 1);
  assert.match(result.stdout, /REQ-101 的代码实现路径不存在：src\/missing\.js/);
  assert.match(result.stdout, /REQ-101 的测试覆盖路径不存在：tests\/missing\.test\.js/);
});

test('check delivery 拒绝追踪表中的项目外路径', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-trace-escape-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  writeFileSync(join(changeDir, 'traceability.md'), '| REQ-ID | 模块 | 代码实现 | 测试覆盖 | 状态 |\n| REQ-101 | module-a | ../outside.js | tests/example.test.js | ✅ 完成 |\n');

  const result = runCli(directory, 'check', 'delivery', 'example');

  assert.equal(result.status, 1);
  assert.match(result.stdout, /REQ-101 的代码实现路径不在项目内：\.\.\/outside\.js/);
});

test('check delivery 接受带行号的真实追踪证据路径', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-trace-line-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  writeFileSync(join(changeDir, 'traceability.md'), '| REQ-ID | 模块 | 代码实现 | 测试覆盖 | 状态 |\n| REQ-101 | module-a | src/example.js:1 | tests/example.test.js:1 | ✅ 完成 |\n');

  const result = runCli(directory, 'check', 'delivery', 'example');

  assert.equal(result.status, 0);
});

test('check delivery 拒绝目录作为实现或测试证据', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-trace-directory-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  writeFileSync(join(changeDir, 'traceability.md'), '| REQ-ID | 模块 | 代码实现 | 测试覆盖 | 状态 |\n| REQ-101 | module-a | src | tests/example.test.js | ✅ 完成 |\n');

  const result = runCli(directory, 'check', 'delivery', 'example');

  assert.equal(result.status, 1);
  assert.match(result.stdout, /REQ-101 的代码实现路径必须是文件：src/);
});

test('check delivery 在验证输入变化时要求重新验证', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-fingerprint-expired-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  createDeliverableChange(directory);
  writeFileSync(join(directory, 'src', 'example.js'), 'export const example = false;\n');

  const expired = runCli(directory, 'check', 'delivery', 'example');

  assert.equal(expired.status, 1);
  assert.match(expired.stdout, /交付证据已过期：需求、项目输入、追踪文件、验证命令或运行环境已变化/);

  const refreshed = runCli(directory, 'verify', 'delivery', 'example');

  assert.equal(refreshed.status, 0);
  assert.equal(runCli(directory, 'check', 'delivery', 'example').status, 0);

  const changeDir = join(directory, '.novaway', 'powersnexus', 'changes', 'example');
  writeFileSync(join(changeDir, 'delta-specs', 'module-a', 'spec.md'), '## ADDED Requirements\nREQ-101\n\n补充后的需求陈述。\n');
  assert.equal(runCli(directory, 'check', 'delivery', 'example').status, 1);

  const deliveryPath = join(changeDir, 'delivery.json');
  const delivery = JSON.parse(readFileSync(deliveryPath, 'utf8'));
  delivery.steps[0].argv = [process.execPath, '-e', 'process.exit(0);'];
  writeFileSync(deliveryPath, JSON.stringify(delivery));
  const commandExpired = runCli(directory, 'check', 'delivery', 'example');
  assert.equal(commandExpired.status, 1);
  assert.match(commandExpired.stdout, /交付证据已过期：需求、项目输入、追踪文件、验证命令或运行环境已变化/);
});

test('check delivery 将根目录和嵌套模块的项目清单纳入交付快照', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-project-inputs-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  mkdirSync(join(directory, 'src'), { recursive: true });
  writeFileSync(join(directory, 'package-lock.json'), '{"lockfileVersion":3}\n');
  writeFileSync(join(directory, 'src', 'pyproject.toml'), '[project]\nname = "example"\n');
  const changeDir = createDeliverableChange(directory);
  const deliveryPath = join(changeDir, 'delivery.json');
  const delivery = JSON.parse(readFileSync(deliveryPath, 'utf8'));

  assert.ok(delivery.deliveryFingerprint.files.includes('package-lock.json'));
  assert.ok(delivery.deliveryFingerprint.files.includes('src/pyproject.toml'));

  writeFileSync(join(directory, 'package-lock.json'), '{"lockfileVersion":3,"changed":true}\n');
  const rootExpired = runCli(directory, 'check', 'delivery', 'example');
  assert.equal(rootExpired.status, 1);
  assert.match(rootExpired.stdout, /交付证据已过期/);
  assert.equal(runCli(directory, 'verify', 'delivery', 'example').status, 0);

  writeFileSync(join(directory, 'src', 'pyproject.toml'), '[project]\nname = "changed"\n');
  const nestedExpired = runCli(directory, 'next', 'example');
  assert.equal(nestedExpired.status, 0);
  assert.match(nestedExpired.stdout, /交付输入已变化，重新执行本地验证以刷新证据/);
});

test('check delivery 接受完整的库交付证明', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-library-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  writeFileSync(join(changeDir, 'delivery.json'), JSON.stringify({
    profile: 'library',
    verifiedAt: '2026-07-15T00:00:00.000Z',
    steps: [
      { id: 'build', argv: [process.execPath, '-e', 'process.exit(0)'], status: 'passed', exitCode: 0, executedAt: '2026-07-15T00:00:00.000Z' },
      { id: 'test', argv: [process.execPath, '-e', 'process.exit(0)'], status: 'passed', exitCode: 0, executedAt: '2026-07-15T00:00:00.000Z' },
      { id: 'integration', argv: [process.execPath, '-e', 'process.exit(0)'], status: 'passed', exitCode: 0, executedAt: '2026-07-15T00:00:00.000Z' },
      { id: 'package', argv: [process.execPath, '-e', 'process.exit(0)'], status: 'passed', exitCode: 0, executedAt: '2026-07-15T00:00:00.000Z' },
    ],
  }));
  updateDeliveryFingerprint(directory, changeDir, ['src/example.js', 'tests/example.test.js']);

  const result = runCli(directory, 'check', 'delivery', 'example');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /交付检查通过：规划、任务、追踪和交付证明完整/);
});

test('verify delivery 无 Shell 地执行 argv 并写回实际证据', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-verify-pass-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  const deliveryPath = join(changeDir, 'delivery.json');
  const delivery = JSON.parse(readFileSync(deliveryPath, 'utf8'));
  delete delivery.verifiedAt;
  for (const step of delivery.steps) {
    step.status = 'pending';
    delete step.exitCode;
    delete step.executedAt;
  }
  writeFileSync(deliveryPath, JSON.stringify(delivery));

  const result = runCli(directory, 'verify', 'delivery', 'example');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /所有交付命令已实际通过/);
  const verifiedDelivery = JSON.parse(readFileSync(deliveryPath, 'utf8'));
  assert.match(verifiedDelivery.verifiedAt, /^202\d-/);
  assert.deepEqual(verifiedDelivery.deliveryFingerprint.files, ['.novaway/powersnexus/changes/example/delta-specs/module-a/spec.md', 'src/example.js', 'tests/example.test.js']);
  assert.equal(verifiedDelivery.deliveryFingerprint.algorithm, 'sha256');
  assert.deepEqual(verifiedDelivery.deliveryFingerprint.environment, {
    platform: process.platform,
    arch: process.arch,
    node: process.version,
  });
  assert.match(verifiedDelivery.deliveryFingerprint.digest, /^[a-f0-9]{64}$/);
  for (const step of verifiedDelivery.steps) {
    assert.equal(step.status, 'passed');
    assert.equal(step.exitCode, 0);
    assert.match(step.executedAt, /^202\d-/);
  }
  const deliveryReport = readFileSync(join(changeDir, 'delivery-report.md'), 'utf8');
  assert.match(deliveryReport, /# 本地交付报告：example/);
  assert.match(deliveryReport, /\| Profile \| application \|/);
  assert.match(deliveryReport, new RegExp(`\\| 平台 \\| ${process.platform} \\|`));
  assert.match(deliveryReport, new RegExp(`\\| 架构 \\| ${process.arch} \\|`));
  assert.match(deliveryReport, /\| build \| .* \| passed \| 0 \|/);
  assert.match(deliveryReport, /`src\/example\.js`/);
  assert.match(deliveryReport, new RegExp(verifiedDelivery.deliveryFingerprint.digest));
  assert.match(deliveryReport, /交付真实性仍以实时运行 `powersnexus check delivery example` 的结果为准/);
});

test('verify delivery 在首个失败步骤停止并保留实际失败证据', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-delivery-verify-fail-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  const deliveryPath = join(changeDir, 'delivery.json');
  const delivery = JSON.parse(readFileSync(deliveryPath, 'utf8'));
  delete delivery.verifiedAt;
  for (const step of delivery.steps) {
    step.status = 'pending';
    delete step.exitCode;
    delete step.executedAt;
  }
  delivery.steps[1].argv = [process.execPath, '-e', 'process.exit(7)'];
  writeFileSync(deliveryPath, JSON.stringify(delivery));

  const result = runCli(directory, 'verify', 'delivery', 'example');

  assert.equal(result.status, 1);
  assert.match(result.stderr, /test 执行失败：退出码 7/);
  const failedDelivery = JSON.parse(readFileSync(deliveryPath, 'utf8'));
  assert.equal(failedDelivery.verifiedAt, undefined);
  assert.equal(failedDelivery.steps[0].status, 'passed');
  assert.equal(failedDelivery.steps[1].status, 'failed');
  assert.equal(failedDelivery.steps[1].exitCode, 7);
  assert.equal(failedDelivery.steps[2].status, 'pending');
  assert.equal(existsSync(join(changeDir, 'delivery-report.md')), false);
});

test('next 在交付命令未执行时建议显式运行交付验证', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-next-verify-delivery-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  const deliveryPath = join(changeDir, 'delivery.json');
  const delivery = JSON.parse(readFileSync(deliveryPath, 'utf8'));
  delete delivery.verifiedAt;
  for (const step of delivery.steps) {
    step.status = 'pending';
    delete step.exitCode;
    delete step.executedAt;
  }
  writeFileSync(deliveryPath, JSON.stringify(delivery));

  const result = runCli(directory, 'next', 'example');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /显式执行本地构建、测试、集成和运行验证/);
  assert.match(result.stdout, /powersnexus verify delivery example/);
});

test('next 在缺少 delivery.json 时建议初始化交付契约', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-next-init-delivery-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  rmSync(join(changeDir, 'delivery.json'));

  const result = runCli(directory, 'next', 'example');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /初始化并填写 delivery\.json/);
  assert.match(result.stdout, /powersnexus init delivery example --profile application/);
});

test('archive 在交付门槛失败时不写入或移动变更', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-archive-delivery-gate-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  rmSync(join(changeDir, 'delivery.json'));

  const result = runCli(directory, 'archive', 'example');

  assert.equal(result.status, 1);
  assert.match(result.stdout, /交付门槛未通过/);
  assert.equal(existsSync(changeDir), true);
  assert.equal(existsSync(join(directory, '.novaway', 'powersnexus', 'specs', 'module-a', 'spec.md')), false);
  assert.equal(existsSync(join(directory, '.novaway', 'powersnexus', 'changes', 'archive')), false);
});

test('checkpoint 显式保存并列出长任务恢复点', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-checkpoint-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = join(directory, '.novaway', 'powersnexus', 'changes', 'example');
  mkdirSync(changeDir, { recursive: true });

  const saveResult = runCli(directory, 'checkpoint', 'save', 'example', '--task', '2.1', '--next', '运行聚焦测试');

  assert.equal(saveResult.status, 0);
  assert.match(saveResult.stdout, /已保存 checkpoint/);
  const checkpointPath = join(changeDir, '.powersnexus', 'checkpoints.json');
  const checkpoints = JSON.parse(readFileSync(checkpointPath, 'utf8'));
  assert.equal(checkpoints.length, 1);
  assert.equal(checkpoints[0].task, '2.1');
  assert.equal(checkpoints[0].next, '运行聚焦测试');

  const listResult = runCli(directory, 'checkpoint', 'list', 'example');
  assert.equal(listResult.status, 0);
  assert.match(listResult.stdout, /任务：2\.1/);
  assert.match(listResult.stdout, /下一步：运行聚焦测试/);
});

test('checkpoint list 在没有记录时不创建状态文件', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-checkpoint-empty-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = join(directory, '.novaway', 'powersnexus', 'changes', 'example');
  mkdirSync(changeDir, { recursive: true });

  const result = runCli(directory, 'checkpoint', 'list', 'example');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /暂无 checkpoint/);
  assert.equal(existsSync(join(changeDir, '.powersnexus', 'checkpoints.json')), false);
});

test('archive 自动合并 Brownfield 的 ADDED、MODIFIED 和 REMOVED 需求并保存快照', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-archive-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  const deltaDir = join(changeDir, 'delta-specs', 'module-a');
  const masterDir = join(directory, '.novaway', 'powersnexus', 'specs', 'module-a');
  mkdirSync(masterDir, { recursive: true });
  writeFileSync(join(changeDir, 'proposal.md'), '创建模式：Brownfield（后续修改）\nREQ-101\nREQ-102\nREQ-103\n');
  writeFileSync(join(changeDir, 'design.md'), 'REQ-101\nREQ-102\nREQ-103\n');
  writeFileSync(join(changeDir, 'tasks.md'), '- [x] 实现并验证 REQ-101、REQ-102、REQ-103\n');
  writeFileSync(join(changeDir, 'cross-reference.md'), 'REQ-101\nREQ-102\nREQ-103\n');
  writeFileSync(join(changeDir, 'traceability.md'), '| REQ-101 | module-a | src/a.js | tests/a.test.js | ✅ 完成 |\n| REQ-102 | module-a | src/a.js | tests/a.test.js | ✅ 完成 |\n| REQ-103 | module-a | src/a.js | tests/a.test.js | ✅ 完成 |\n');
  writeFileSync(join(deltaDir, 'spec.md'), `## ADDED Requirements

### REQ-103: 新增需求

**陈述：** 新增行为。

## MODIFIED Requirements

### REQ-101: 修改需求

**陈述：** 修改后的行为。

## REMOVED Requirements

### REQ-102: 移除需求

**陈述：** 已废弃。
`);
  updateDeliveryFingerprint(directory, changeDir, ['src/a.js', 'tests/a.test.js']);
  writeFileSync(join(masterDir, 'spec.md'), createBrownfieldMasterSpec([
    { id: 'REQ-101', statement: '原始行为。' },
    { id: 'REQ-102', statement: '待移除行为。' },
  ]));

  const result = runCli(directory, 'archive', 'example');

  assert.equal(result.status, 0);
  const masterSpec = readFileSync(join(masterDir, 'spec.md'), 'utf8');
  assert.match(masterSpec, /#### REQ-101: 修改需求/);
  assert.match(masterSpec, /修改后的行为/);
  assert.doesNotMatch(masterSpec, /待移除行为|#### REQ-102/);
  assert.match(masterSpec, /#### REQ-103: 新增需求/);
  assert.match(masterSpec, /> 版本：v1\.1/);
  assert.match(masterSpec, /\| v1\.1 \| .* \| ADDED\/MODIFIED\/REMOVED \|/);
  const archiveDir = join(directory, '.novaway', 'powersnexus', 'changes', 'archive');
  const [archiveName] = readdirSync(archiveDir);
  const archivePath = join(archiveDir, archiveName);
  assert.match(readFileSync(join(archivePath, '.powersnexus', 'pre-merge-snapshot', 'module-a.spec.md'), 'utf8'), /原始行为/);
  const mergeReport = readFileSync(join(archivePath, 'merge-report.md'), 'utf8');
  assert.match(mergeReport, /\| REQ-101 \| REQ-101 \| MODIFIED \| module-a 主规格已更新 \|/);
  assert.match(mergeReport, /\| REQ-102 \| - \| REMOVED \| module-a 主规格已更新 \|/);
  assert.match(mergeReport, /\| - \| REQ-103 \| ADDED \| module-a 主规格已更新 \|/);
  const deliveryReport = readFileSync(join(archivePath, 'delivery-report.md'), 'utf8');
  assert.match(deliveryReport, /# 本地交付报告：example/);
  assert.match(deliveryReport, /## 实际验证步骤/);
  assert.match(deliveryReport, /## 证据摘要/);
});

test('archive 在 Mixed 变更中按模块分别更新 Brownfield 和创建 Greenfield 主规格', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-archive-mixed-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  const moduleADelta = join(changeDir, 'delta-specs', 'module-a', 'spec.md');
  const moduleBDeltaDir = join(changeDir, 'delta-specs', 'module-b');
  const moduleAMasterDir = join(directory, '.novaway', 'powersnexus', 'specs', 'module-a');
  mkdirSync(moduleAMasterDir, { recursive: true });
  mkdirSync(moduleBDeltaDir, { recursive: true });
  writeFileSync(join(changeDir, 'proposal.md'), '创建模式：Mixed（混合）\nREQ-101\nREQ-201\n');
  writeFileSync(join(changeDir, 'design.md'), 'REQ-101\nREQ-201\n');
  writeFileSync(join(changeDir, 'tasks.md'), '- [x] 实现并验证 REQ-101、REQ-201\n');
  writeFileSync(join(changeDir, 'cross-reference.md'), 'REQ-101\nREQ-201\n');
  writeFileSync(join(changeDir, 'traceability.md'), '| REQ-101 | module-a | src/a.js | tests/a.test.js | ✅ 完成 |\n| REQ-201 | module-b | src/b.js | tests/b.test.js | ✅ 完成 |\n');
  writeFileSync(moduleADelta, '## MODIFIED Requirements\n\n### REQ-101: 修改需求\n\n**陈述：** Mixed 更新。\n');
  writeFileSync(join(moduleBDeltaDir, 'spec.md'), '## ADDED Requirements\n\n### REQ-201: 新模块需求\n\n**陈述：** Mixed 新建。\n');
  updateDeliveryFingerprint(directory, changeDir, ['src/a.js', 'src/b.js', 'tests/a.test.js', 'tests/b.test.js']);
  writeFileSync(join(moduleAMasterDir, 'spec.md'), createBrownfieldMasterSpec([{ id: 'REQ-101', statement: 'Mixed 原始。' }]));

  const result = runCli(directory, 'archive', 'example');

  assert.equal(result.status, 0);
  assert.match(readFileSync(join(moduleAMasterDir, 'spec.md'), 'utf8'), /Mixed 更新/);
  assert.match(readFileSync(join(directory, '.novaway', 'powersnexus', 'specs', 'module-b', 'spec.md'), 'utf8'), /REQ-201/);
});

test('archive 在 Brownfield REQ 冲突时不写入任何主规格或归档', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-archive-conflict-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  const deltaPath = join(changeDir, 'delta-specs', 'module-a', 'spec.md');
  const masterDir = join(directory, '.novaway', 'powersnexus', 'specs', 'module-a');
  mkdirSync(masterDir, { recursive: true });
  writeFileSync(join(changeDir, 'proposal.md'), '创建模式：Brownfield（后续修改）\nREQ-101\n');
  writeFileSync(deltaPath, '## ADDED Requirements\n\n### REQ-101: 冲突需求\n\n**陈述：** 不应覆盖。\n');
  updateDeliveryFingerprint(directory, changeDir, ['src/example.js', 'tests/example.test.js']);
  const originalMaster = createBrownfieldMasterSpec([{ id: 'REQ-101', statement: '保留原始。' }]);
  writeFileSync(join(masterDir, 'spec.md'), originalMaster);

  const result = runCli(directory, 'archive', 'example');

  assert.equal(result.status, 1);
  assert.match(result.stdout, /ADDED REQ-101 已存在于主规格/);
  assert.equal(readFileSync(join(masterDir, 'spec.md'), 'utf8'), originalMaster);
  assert.equal(existsSync(join(changeDir, 'merge-report.md')), false);
  assert.equal(existsSync(join(changeDir, 'delivery-report.md')), false);
  assert.equal(existsSync(join(directory, '.novaway', 'powersnexus', 'changes', 'archive')), false);
});

test('archive 在归档目标重名时保持交付报告与主规格零写入', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-archive-target-conflict-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = createDeliverableChange(directory);
  const archivePath = join(
    directory,
    '.novaway',
    'powersnexus',
    'changes',
    'archive',
    `${new Date().toISOString().split('T')[0]}-example`,
  );
  mkdirSync(archivePath, { recursive: true });

  const result = runCli(directory, 'archive', 'example');

  assert.equal(result.status, 1);
  assert.match(result.stdout, /归档目标已存在/);
  assert.equal(existsSync(changeDir), true);
  assert.equal(existsSync(join(changeDir, 'delivery-report.md')), false);
  assert.equal(existsSync(join(changeDir, 'merge-report.md')), false);
  assert.equal(existsSync(join(directory, '.novaway', 'powersnexus', 'specs', 'module-a', 'spec.md')), false);
  assert.deepEqual(readdirSync(archivePath), []);
});

test('archive 为 Greenfield 变更创建可追溯且无占位符的主规格', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-archive-greenfield-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = join(directory, '.novaway', 'powersnexus', 'changes', 'example');
  const deltaDir = join(changeDir, 'delta-specs', 'module-a');
  createDeliverableChange(directory);
  writeFileSync(join(deltaDir, 'spec.md'), '## ADDED Requirements\n\n### Requirement: 示例需求\n\n系统必须满足 REQ-101。\n');
  updateDeliveryFingerprint(directory, changeDir, ['src/example.js', 'tests/example.test.js']);

  const result = runCli(directory, 'archive', 'example');

  assert.equal(result.status, 0);
  const masterSpecPath = join(directory, '.novaway', 'powersnexus', 'specs', 'module-a', 'spec.md');
  const masterSpec = readFileSync(masterSpecPath, 'utf8');
  assert.match(masterSpec, /来源变更：example/);
  assert.match(masterSpec, /REQ-101/);
  assert.doesNotMatch(masterSpec, /待补充|请从 proposal|REQ-xxx/);

  const archiveDir = join(directory, '.novaway', 'powersnexus', 'changes', 'archive');
  const [archiveName] = readdirSync(archiveDir);
  const mergeReport = readFileSync(join(archiveDir, archiveName, 'merge-report.md'), 'utf8');
  assert.match(mergeReport, /\| - \| REQ-101 \| ADDED \| module-a 主规格已创建 \|/);
  assert.doesNotMatch(mergeReport, /REQ-xxx|\[ \] 主规格已更新或新建/);
});

test('check consistency 验证完整的需求映射与任务进度', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-consistency-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = join(directory, '.novaway', 'powersnexus', 'changes', 'example');
  const deltaDir = join(changeDir, 'delta-specs', 'module-a');
  mkdirSync(deltaDir, { recursive: true });
  writeFileSync(join(changeDir, 'proposal.md'), 'REQ-101\n');
  writeFileSync(join(changeDir, 'design.md'), 'REQ-101\n');
  writeFileSync(join(changeDir, 'tasks.md'), '- [x] 实现 REQ-101\n');
  writeFileSync(join(changeDir, 'cross-reference.md'), 'REQ-101\n');
  writeFileSync(join(deltaDir, 'spec.md'), '## ADDED Requirements\nREQ-101\n');

  const result = runCli(directory, 'check', 'consistency', 'example');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /所有检查通过/);
  assert.match(result.stdout, /任务进度: 100%/);
});

test('check consistency 拒绝缺少 Delta Spec REQ 映射的文档', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-consistency-missing-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = join(directory, '.novaway', 'powersnexus', 'changes', 'example');
  const deltaDir = join(changeDir, 'delta-specs', 'module-a');
  mkdirSync(deltaDir, { recursive: true });
  writeFileSync(join(changeDir, 'proposal.md'), 'REQ-101\n');
  writeFileSync(join(changeDir, 'design.md'), '没有需求映射\n');
  writeFileSync(join(changeDir, 'tasks.md'), '- [x] 实现 REQ-101\n');
  writeFileSync(join(changeDir, 'cross-reference.md'), 'REQ-101\n');
  writeFileSync(join(deltaDir, 'spec.md'), '## ADDED Requirements\nREQ-101\n');

  const result = runCli(directory, 'check', 'consistency', 'example');

  assert.equal(result.status, 1);
  assert.match(result.stdout, /design.md 缺少 REQ: REQ-101/);
});

test('trace 从所有 Delta Spec 输出需求追踪表', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'powersnexus-trace-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const changeDir = join(directory, '.novaway', 'powersnexus', 'changes', 'example', 'delta-specs');
  mkdirSync(join(changeDir, 'module-a'), { recursive: true });
  mkdirSync(join(changeDir, 'module-b'), { recursive: true });
  writeFileSync(join(changeDir, 'module-a', 'spec.md'), 'REQ-101\n');
  writeFileSync(join(changeDir, 'module-b', 'spec.md'), 'REQ-102\n');

  const result = runCli(directory, 'trace', 'example');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /需求数量: 2/);
  assert.match(result.stdout, /\| REQ-101 \| module-a \|/);
  assert.match(result.stdout, /\| REQ-102 \| module-b \|/);
  const traceabilityPath = join(directory, '.novaway', 'powersnexus', 'changes', 'example', 'traceability.md');
  const traceability = readFileSync(traceabilityPath, 'utf8');
  assert.match(traceability, /# 需求追踪表：example/);
  assert.match(traceability, /\| REQ-101 \| module-a \|/);
  assert.match(traceability, /\| REQ-102 \| module-b \|/);
});
