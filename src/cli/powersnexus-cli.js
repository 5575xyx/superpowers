#!/usr/bin/env node
/**
 * PowersNexus CLI - 自动化工具集
 * 
 * 命令列表：
 * - check consistency <change-name>  - 文档一致性检查
 * - archive <change-name>            - 归档合并自动化
 * - start <task-description>         - 流程启动器
 * - trace <change-name>              - 需求追踪自动生成
 * - help                             - 帮助信息
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync, statSync, renameSync } from 'fs';
import { spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { basename, join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_EXIT,
  inspectChange,
  serializeBridgeError,
  transitionChange,
  validateChange,
} from '../bridge/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PACKAGE_ROOT = join(__dirname, '../..');
const BASE_DIR = process.cwd();
const POWERSEXUS_DIR = join(BASE_DIR, '.novaway', 'powersnexus');
const CHANGES_DIR = join(POWERSEXUS_DIR, 'changes');
const SPECS_DIR = join(POWERSEXUS_DIR, 'specs');
const PACKAGE_VERSION = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8')).version;
const PROCESS_LEVELS = {
  L0: { name: '微型修复', steps: '直接修改 → 聚焦验证', docs: '无', time: '< 5 分钟', activation: '不加载流程技能；只进行直接修改和聚焦验证', tokenBudget: '极低' },
  L1: { name: '快速迭代', steps: '简短假设 → 实现 → 测试', docs: '简短验收说明', time: '< 30 分钟', activation: '只激活当前领域技能；最多一次必要澄清', tokenBudget: '低' },
  L2: { name: '标准流程', steps: '设计契约 → 计划 → 实现 → 审查 → 测试', docs: 'design.md + tasks.md', time: '1-2 小时', activation: '激活 brainstorming、writing-plans 和直接领域技能', tokenBudget: '中' },
  L3: { name: '完整流程', steps: '完整 OpenSpec + 风险审查 + TDD', docs: '全套文档', time: '4-8 小时', activation: '激活完整规格、审查和验证技能', tokenBudget: '高' },
  L4: { name: '重量级', steps: 'L3 + 多轮审查 + 用户确认', docs: '全套 + 评审记录', time: '1 天+', activation: '激活 L3 全集，并增加多轮审查和明确批准', tokenBudget: '高（以风险控制为优先）' },
};
const PROFILES_ROOT = join(PACKAGE_ROOT, 'profiles');
const PROFILE_DEFINITIONS = Object.fromEntries(
  readdirSync(PROFILES_ROOT)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const profile = JSON.parse(readFileSync(join(PROFILES_ROOT, file), 'utf8'));
      return [profile.id, profile];
    }),
);
const DELIVERY_PROFILES = Object.fromEntries(
  Object.entries(PROFILE_DEFINITIONS).map(([id, profile]) => [id, profile.requiredSteps]),
);
const PROJECT_INPUT_NAMES = new Set([
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

// ============== 工具函数 ==============

function readMarkdown(filePath) {
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, 'utf-8');
}

function extractReqIds(content) {
  if (!content) return [];
  const matches = content.match(/REQ-\d+/g);
  return matches ? [...new Set(matches)] : [];
}

function extractChecklistItems(content) {
  if (!content) return [];
  const matches = content.match(/- \[[ x]\] .+/g);
  return matches || [];
}

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function readJsonWithoutBom(filePath) {
  const content = readFileSync(filePath, 'utf8');
  if (content.charCodeAt(0) === 0xFEFF) {
    throw new Error('包含 UTF-8 BOM');
  }
  return JSON.parse(content);
}

function loadDeliveryEvidence(changeDir) {
  const deliveryPath = join(changeDir, 'delivery.json');
  if (!existsSync(deliveryPath)) {
    return { valid: false, errors: ['缺少 delivery.json'], deliveryPath: null, evidence: null };
  }

  let evidence;
  try {
    evidence = readJsonWithoutBom(deliveryPath);
  } catch (error) {
    return { valid: false, errors: [`delivery.json 无法读取：${error.message}`], deliveryPath, evidence: null };
  }
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    return { valid: false, errors: ['delivery.json 根节点必须是对象'], deliveryPath, evidence: null };
  }

  return { valid: true, errors: [], deliveryPath, evidence };
}

function hasValidDeliveryArgv(argv, { runnerOwned = false } = {}) {
  return Array.isArray(argv) && (runnerOwned || argv.length > 0) && argv.every((argument) =>
    typeof argument === 'string' && argument.trim() && !/替换为真实|\bTODO\b|\bTBD\b|\bREPLACE_/i.test(argument),
  );
}

function createDeliveryTemplate(profile) {
  return {
    profile,
    steps: DELIVERY_PROFILES[profile].map((id) => ({
      id,
      argv: ['REPLACE_EXECUTABLE', `REPLACE_${id.toUpperCase()}_ARGUMENTS`],
      status: 'pending',
    })),
  };
}

function initializeDelivery(changeName, args) {
  const changeDir = join(CHANGES_DIR, changeName || '');
  if (!changeName || !existsSync(changeDir)) {
    console.error(`❌ 错误: 变更目录不存在: ${changeDir}`);
    return 1;
  }
  const profileIndex = args.indexOf('--profile');
  const profile = profileIndex === -1 ? 'application' : args[profileIndex + 1];
  if (!DELIVERY_PROFILES[profile]) {
    console.error('❌ --profile 仅支持 application、library、web 或 document。');
    return 1;
  }
  const deliveryPath = join(changeDir, 'delivery.json');
  if (existsSync(deliveryPath)) {
    console.error(`❌ delivery.json 已存在，拒绝覆盖：${deliveryPath}`);
    return 1;
  }
  writeDeliveryEvidence(deliveryPath, createDeliveryTemplate(profile));
  console.log(`\n✅ 已初始化 ${profile} 交付契约。`);
  console.log(`📄 路径：${deliveryPath}`);
  console.log(`下一步：填入真实 argv 后运行 powersnexus verify delivery ${changeName}\n`);
  return 0;
}

function validateDeliveryEvidence(changeDir, { requireExecution = true } = {}) {
  const loaded = loadDeliveryEvidence(changeDir);
  if (!loaded.valid) return loaded;

  const errors = [];
  const { evidence } = loaded;
  const requiredSteps = DELIVERY_PROFILES[evidence.profile];
  if (!requiredSteps) {
    errors.push('profile 必须是已注册的交付 profile（application/library/web/document）');
  }
  if (requireExecution && (typeof evidence.verifiedAt !== 'string' || Number.isNaN(Date.parse(evidence.verifiedAt)))) {
    errors.push('verifiedAt 必须是有效的 ISO 时间');
  }
  if (!Array.isArray(evidence.steps)) {
    errors.push('steps 必须是数组');
  } else if (requiredSteps) {
    for (const stepId of requiredSteps) {
      const step = evidence.steps.find((item) => item?.id === stepId);
      if (!step) {
        errors.push(`缺少 ${stepId} 验证步骤`);
      } else if (!hasValidDeliveryArgv(step.argv, { runnerOwned: PROFILE_DEFINITIONS[evidence.profile].runnerOwnedSteps.includes(stepId) })) {
        errors.push(`${stepId} 必须提供真实 argv 命令数组`);
      } else if (requireExecution) {
        if (step.status !== 'passed') {
          errors.push(`${stepId} 状态必须为 passed`);
        }
        if (step.exitCode !== 0) {
          errors.push(`${stepId} exitCode 必须为 0`);
        }
        if (typeof step.executedAt !== 'string' || Number.isNaN(Date.parse(step.executedAt))) {
          errors.push(`${stepId} 缺少有效 executedAt`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, deliveryPath: loaded.deliveryPath, evidence };
}

function readBridgeRequest(args) {
  const requestIndex = args.indexOf('--request');
  if (requestIndex !== -1) {
    const requestPath = args[requestIndex + 1];
    if (!requestPath) throw Object.assign(new Error('--request 缺少 JSON 文件路径。'), { code: 'INVALID_REQUEST', exitCode: BRIDGE_EXIT.INVALID_REQUEST });
    return readJsonWithoutBom(requestPath);
  }
  const input = readFileSync(0, 'utf8').trim();
  if (!input) throw Object.assign(new Error('请通过 stdin 或 --request 提供 Action JSON。'), { code: 'INVALID_REQUEST', exitCode: BRIDGE_EXIT.INVALID_REQUEST });
  return JSON.parse(input);
}

function bridgeCommand(subCommand, args) {
  const changeIndex = args.indexOf('--change');
  const changeName = changeIndex === -1 ? null : args[changeIndex + 1];
  const formatIndex = args.indexOf('--format');
  const format = formatIndex === -1 ? (subCommand === 'transition' ? 'jsonl' : 'json') : args[formatIndex + 1];
  if (!['json', 'jsonl'].includes(format)) {
    console.error(JSON.stringify(serializeBridgeError(Object.assign(new Error('--format 仅支持 json 或 jsonl。'), { code: 'INVALID_REQUEST' }))));
    return BRIDGE_EXIT.INVALID_REQUEST;
  }
  try {
    const options = { projectRoot: BASE_DIR, changeName, powersnexusVersion: PACKAGE_VERSION };
    let result;
    if (subCommand === 'inspect') result = inspectChange(options);
    else if (subCommand === 'validate') result = validateChange(options);
    else if (subCommand === 'transition') {
      const request = readBridgeRequest(args);
      if (format === 'jsonl') console.log(JSON.stringify({ protocolVersion: '1.0', type: 'action.started', actionID: request.actionID }));
      result = transitionChange({ ...options, profilesRoot: PROFILES_ROOT, request });
    } else {
      throw Object.assign(new Error(`未知 Bridge 命令：${subCommand || '未提供'}`), { code: 'INVALID_REQUEST', exitCode: BRIDGE_EXIT.INVALID_REQUEST });
    }
    console.log(JSON.stringify(format === 'jsonl' ? { protocolVersion: '1.0', type: 'action.completed', ...result } : result));
    return BRIDGE_EXIT.OK;
  } catch (error) {
    console.error(JSON.stringify(serializeBridgeError(error)));
    return error.exitCode || BRIDGE_EXIT.INTERNAL;
  }
}

function writeDeliveryEvidence(deliveryPath, evidence) {
  writeFileSync(deliveryPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
}

function escapeMarkdownTableCell(value) {
  return String(value)
    .replaceAll('\\', '\\\\')
    .replaceAll('|', '\\|')
    .replaceAll('`', '\\`')
    .replaceAll('\r', '')
    .replaceAll('\n', '<br>');
}

function generateDeliveryReport(changeName, evidence) {
  const fingerprint = evidence.deliveryFingerprint;
  const steps = DELIVERY_PROFILES[evidence.profile].map((stepId) => {
    const step = evidence.steps.find((item) => item.id === stepId);
    return `| ${escapeMarkdownTableCell(step.id)} | ${escapeMarkdownTableCell(JSON.stringify(step.argv))} | ${escapeMarkdownTableCell(step.status)} | ${step.exitCode} | ${escapeMarkdownTableCell(step.executedAt)} |`;
  }).join('\n');
  const files = fingerprint.files.length > 0
    ? fingerprint.files.map((file) => `- \`${file.replaceAll('`', '\\`')}\``).join('\n')
    : '- 无';

  return `# 本地交付报告：${changeName}

> 本报告由已通过的 \`delivery.json\` 生成，便于人工审阅；交付真实性仍以实时运行 \`powersnexus check delivery ${changeName}\` 的结果为准。

## 交付状态

| 字段 | 内容 |
|------|------|
| 变更 | ${escapeMarkdownTableCell(changeName)} |
| Profile | ${escapeMarkdownTableCell(evidence.profile)} |
| 本地状态 | 已完成构建、测试、集成与 Profile 必需的运行或制品验证 |
| 验证时间 | ${escapeMarkdownTableCell(evidence.verifiedAt)} |
| 平台 | ${escapeMarkdownTableCell(fingerprint.environment.platform)} |
| 架构 | ${escapeMarkdownTableCell(fingerprint.environment.arch)} |
| Node.js | ${escapeMarkdownTableCell(fingerprint.environment.node)} |

## 实际验证步骤

| 步骤 | argv | 状态 | 退出码 | 执行时间 |
|------|------|------|--------|----------|
${steps}

## 证据文件

${files}

## 证据摘要

- 算法：${fingerprint.algorithm}
- SHA-256：\`${fingerprint.digest}\`
`;
}

function writeDeliveryReport(changeDir, changeName, evidence) {
  const reportPath = join(changeDir, 'delivery-report.md');
  writeFileSync(reportPath, generateDeliveryReport(changeName, evidence), 'utf8');
  return reportPath;
}

function collectDeltaRequirementIds(changeDir) {
  const deltaSpecsDir = join(changeDir, 'delta-specs');
  if (!existsSync(deltaSpecsDir)) return [];
  const requirements = [];
  for (const module of readdirSync(deltaSpecsDir)) {
    const specPath = join(deltaSpecsDir, module, 'spec.md');
    if (existsSync(specPath)) requirements.push(...extractReqIds(readMarkdown(specPath)));
  }
  return [...new Set(requirements)];
}

function validateTraceabilityEvidence(changeDir) {
  const traceability = readMarkdown(join(changeDir, 'traceability.md'));
  if (!traceability) return { errors: ['缺少 traceability.md'], files: [] };
  const rows = new Map();
  const errors = [];
  const files = new Set();
  for (const line of traceability.split(/\r?\n/)) {
    if (!/^\|\s*REQ-\d+\s*\|/.test(line)) continue;
    const columns = line.split('|').slice(1, -1).map((column) => column.trim());
    if (columns.length < 5) {
      errors.push(`追踪表行字段不足：${line}`);
      continue;
    }
    if (rows.has(columns[0])) {
      errors.push(`追踪表存在重复 REQ 行：${columns[0]}`);
      continue;
    }
    rows.set(columns[0], columns);
  }

  const validatePaths = (value, requirementId, label) => {
    const paths = value.split(',').map((path) => path.trim().replace(/^`|`$/g, '').replace(/:\d+$/, '')).filter(Boolean);
    if (paths.length === 0 || /待实现|待测试|⏳|\bTODO\b|\bTBD\b|^-$/i.test(value)) {
      errors.push(`${requirementId} 缺少${label}路径`);
      return;
    }
    for (const path of paths) {
      if (path.startsWith('/') || path.startsWith('\\') || /^[a-zA-Z]:[\\/]/.test(path) || path.split(/[\\/]/).includes('..')) {
      errors.push(`${requirementId} 的${label}路径不在项目内：${path}`);
      } else if (!existsSync(join(BASE_DIR, path))) {
        errors.push(`${requirementId} 的${label}路径不存在：${path}`);
      } else if (!statSync(join(BASE_DIR, path)).isFile()) {
        errors.push(`${requirementId} 的${label}路径必须是文件：${path}`);
      } else {
        files.add(path);
      }
    }
  };

  for (const requirementId of collectDeltaRequirementIds(changeDir)) {
    const row = rows.get(requirementId);
    if (!row) {
      errors.push(`traceability.md 缺少 ${requirementId} 完成行`);
      continue;
    }
    validatePaths(row[2], requirementId, '代码实现');
    validatePaths(row[3], requirementId, '测试覆盖');
    if (!/(✅|完成|passed)/i.test(row[4]) || /待|⏳|❌/.test(row[4])) {
      errors.push(`${requirementId} 状态未标记为完成`);
    }
  }
  return { errors, files: [...files].sort() };
}

function collectDeltaSpecFiles(changeDir) {
  const deltaSpecsDir = join(changeDir, 'delta-specs');
  if (!existsSync(deltaSpecsDir)) return [];
  return readdirSync(deltaSpecsDir)
    .map((module) => join(deltaSpecsDir, module, 'spec.md'))
    .filter((specPath) => existsSync(specPath))
    .map((specPath) => relative(BASE_DIR, specPath).replaceAll('\\', '/'));
}

function isProjectInputName(fileName) {
  const normalized = fileName.toLowerCase();
  return PROJECT_INPUT_NAMES.has(normalized)
    || /^requirements(?:[-.][^.]+)?\.txt$/i.test(fileName)
    || /\.(?:cs|fs|vb)proj$/i.test(fileName)
    || /\.sln$/i.test(fileName)
    || /^dockerfile\..+/i.test(fileName);
}

function collectProjectInputFiles(traceabilityFiles) {
  const directories = new Set([BASE_DIR]);
  for (const file of traceabilityFiles) {
    let current = dirname(join(BASE_DIR, file));
    while (current !== BASE_DIR) {
      const relativeDir = relative(BASE_DIR, current);
      if (relativeDir.startsWith('..')) break;
      directories.add(current);
      current = dirname(current);
    }
  }

  const files = [];
  for (const directory of directories) {
    for (const fileName of readdirSync(directory)) {
      const filePath = join(directory, fileName);
      if (isProjectInputName(fileName) && statSync(filePath).isFile()) {
        files.push(relative(BASE_DIR, filePath).replaceAll('\\', '/'));
      }
    }
  }
  return files;
}

function createDeliveryFingerprint(changeDir, traceabilityFiles, evidence) {
  const files = [...new Set([
    ...collectDeltaSpecFiles(changeDir),
    ...collectProjectInputFiles(traceabilityFiles),
    ...traceabilityFiles,
  ])].sort();
  const commands = DELIVERY_PROFILES[evidence.profile].map((id) => {
    const step = evidence.steps.find((item) => item?.id === id);
    return { id, argv: step.argv, timeoutMs: step.timeoutMs ?? null };
  });
  const environment = { platform: process.platform, arch: process.arch, node: process.version };
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file);
    hash.update('\0');
    hash.update(readFileSync(join(BASE_DIR, file)));
    hash.update('\0');
  }
  hash.update(JSON.stringify({ profile: evidence.profile, commands, environment }));
  return { algorithm: 'sha256', files, commands, environment, digest: hash.digest('hex') };
}

function validateDeliveryFingerprint(changeDir, evidence, traceabilityFiles) {
  const fingerprint = evidence.deliveryFingerprint;
  if (!fingerprint || typeof fingerprint !== 'object' || Array.isArray(fingerprint)) {
    return ['缺少 deliveryFingerprint；请重新运行 powersnexus verify delivery。'];
  }
  if (fingerprint.algorithm !== 'sha256' || !Array.isArray(fingerprint.files) || !Array.isArray(fingerprint.commands) || !fingerprint.environment || typeof fingerprint.environment !== 'object' || typeof fingerprint.digest !== 'string') {
    return ['deliveryFingerprint 格式无效；请重新运行 powersnexus verify delivery。'];
  }
  const actual = createDeliveryFingerprint(changeDir, traceabilityFiles, evidence);
  if (fingerprint.digest !== actual.digest || JSON.stringify(fingerprint.files) !== JSON.stringify(actual.files) || JSON.stringify(fingerprint.commands) !== JSON.stringify(actual.commands) || JSON.stringify(fingerprint.environment) !== JSON.stringify(actual.environment)) {
    return ['交付证据已过期：需求、项目输入、追踪文件、验证命令或运行环境已变化，请重新运行 powersnexus verify delivery。'];
  }
  return [];
}

function verifyDelivery(changeName) {
  const changeDir = join(CHANGES_DIR, changeName);
  if (!existsSync(changeDir)) {
    console.error(`❌ 错误: 变更目录不存在: ${changeDir}`);
    return 1;
  }

  const validation = validateDeliveryEvidence(changeDir, { requireExecution: false });
  if (!validation.valid) {
    console.error(`❌ 无法执行交付验证：\n${validation.errors.map((error) => `  - ${error}`).join('\n')}`);
    return 1;
  }
  const traceabilityEvidence = validateTraceabilityEvidence(changeDir);
  if (traceabilityEvidence.errors.length > 0) {
    console.error(`❌ 无法执行交付验证：\n${traceabilityEvidence.errors.map((error) => `  - ${error}`).join('\n')}`);
    return 1;
  }

  const { evidence, deliveryPath } = validation;
  const requiredSteps = DELIVERY_PROFILES[evidence.profile];
  const stepsById = new Map(evidence.steps.map((step) => [step.id, step]));
  delete evidence.verifiedAt;
  delete evidence.deliveryFingerprint;
  for (const stepId of requiredSteps) {
    const step = stepsById.get(stepId);
    step.status = 'pending';
    delete step.exitCode;
    delete step.executedAt;
  }
  writeDeliveryEvidence(deliveryPath, evidence);

  console.log(`\n🚀 执行交付验证: ${changeName}（${evidence.profile}）`);
  for (const stepId of requiredSteps) {
    const step = stepsById.get(stepId);
    const [command, ...args] = step.argv;
    const timeoutMs = Number.isInteger(step.timeoutMs) && step.timeoutMs >= 1000 && step.timeoutMs <= 600000
      ? step.timeoutMs
      : 120000;
    step.status = 'running';
    writeDeliveryEvidence(deliveryPath, evidence);
    console.log(`▶️  ${stepId}: ${JSON.stringify(step.argv)}`);
    const result = spawnSync(command, args, {
      cwd: BASE_DIR,
      shell: false,
      stdio: 'inherit',
      timeout: timeoutMs,
      windowsHide: true,
    });
    const exitCode = typeof result.status === 'number' ? result.status : 1;
    step.exitCode = exitCode;
    step.executedAt = new Date().toISOString();
    step.status = !result.error && exitCode === 0 ? 'passed' : 'failed';
    writeDeliveryEvidence(deliveryPath, evidence);
    if (step.status !== 'passed') {
      const reason = result.error ? result.error.message : `退出码 ${exitCode}`;
      console.error(`❌ ${stepId} 执行失败：${reason}`);
      return 1;
    }
  }

  evidence.deliveryFingerprint = createDeliveryFingerprint(changeDir, traceabilityEvidence.files, evidence);
  evidence.verifiedAt = new Date().toISOString();
  writeDeliveryEvidence(deliveryPath, evidence);
  console.log('✅ 所有交付命令已实际通过，已写入 delivery.json。\n');
  const deliveryStatus = checkDelivery(changeName);
  if (deliveryStatus === 0) {
    const reportPath = writeDeliveryReport(changeDir, changeName, evidence);
    console.log(`📄 已生成本地交付报告：${reportPath}\n`);
  }
  return deliveryStatus;
}

function createUsageSummary() {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    messages: 0,
  };
}

function addUsage(summary, usage) {
  const readNumber = (key) => Number.isFinite(usage?.[key]) && usage[key] >= 0 ? usage[key] : 0;
  summary.inputTokens += readNumber('input_tokens');
  summary.outputTokens += readNumber('output_tokens');
  summary.cacheCreationTokens += readNumber('cache_creation_input_tokens');
  summary.cacheReadTokens += readNumber('cache_read_input_tokens');
  summary.messages++;
}

function formatTokenCount(value) {
  return value.toLocaleString('en-US');
}

function formatModelIdentifiers(models) {
  return models.size > 0 ? [...models].sort().join('、') : '未声明';
}

function collectTelemetry(sessionPath) {
  if (!sessionPath) {
    throw new Error('telemetry 需要 <会话文件.jsonl> 参数。');
  }
  if (!existsSync(sessionPath)) {
    throw new Error(`会话文件不存在：${sessionPath}`);
  }

  let content;
  try {
    content = readFileSync(sessionPath, 'utf8');
  } catch (error) {
    throw new Error(`无法读取会话文件：${error.message}`);
  }
  if (content.charCodeAt(0) === 0xFEFF) {
    throw new Error('会话文件包含 UTF-8 BOM，无法可靠解析。');
  }

  const mainUsage = createUsageSummary();
  const subagentUsage = new Map();
  const models = new Set();
  let invalidLines = 0;

  for (const line of content.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      invalidLines++;
      continue;
    }

    if (record.type === 'assistant' && record.message?.usage) {
      if (typeof record.message.model === 'string' && record.message.model.trim()) {
        models.add(record.message.model.trim());
      }
      addUsage(mainUsage, record.message.usage);
      continue;
    }
    const toolResult = record.type === 'user' ? record.toolUseResult : null;
    if (toolResult?.agentId !== undefined && toolResult?.usage) {
      const agentId = String(toolResult.agentId);
      const summary = subagentUsage.get(agentId) ?? createUsageSummary();
      addUsage(summary, toolResult.usage);
      subagentUsage.set(agentId, summary);
    }
  }

  const totalUsage = createUsageSummary();
  for (const usage of [mainUsage, ...subagentUsage.values()]) {
    totalUsage.inputTokens += usage.inputTokens;
    totalUsage.outputTokens += usage.outputTokens;
    totalUsage.cacheCreationTokens += usage.cacheCreationTokens;
    totalUsage.cacheReadTokens += usage.cacheReadTokens;
    totalUsage.messages += usage.messages;
  }
  const totalInputTokens = totalUsage.inputTokens + totalUsage.cacheCreationTokens + totalUsage.cacheReadTokens;
  const totalTokens = totalInputTokens + totalUsage.outputTokens;

  return {
    sessionName: basename(sessionPath),
    mainUsage,
    subagentUsage,
    models,
    invalidLines,
    totalUsage,
    totalInputTokens,
    totalTokens,
  };
}

/**
 * 只读分析用户显式提供的 Claude Code 会话 JSONL。
 * 不估算费用，也不采集、上传或持久化任何会话内容。
 */
function analyzeTelemetry(sessionPath) {
  let telemetry;
  try {
    telemetry = collectTelemetry(sessionPath);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    return 1;
  }

  const { mainUsage, subagentUsage, models, invalidLines, totalUsage, totalInputTokens, totalTokens } = telemetry;
  console.log(`\n📡 Token 遥测（仅本地只读）：${telemetry.sessionName}`);
  console.log(`模型标识：${formatModelIdentifiers(models)}`);
  console.log(`主会话：${formatTokenCount(mainUsage.messages)} 条计量消息，输入 ${formatTokenCount(mainUsage.inputTokens)}，输出 ${formatTokenCount(mainUsage.outputTokens)}`);
  console.log(`子代理：${formatTokenCount(subagentUsage.size)} 个，${formatTokenCount([...subagentUsage.values()].reduce((count, usage) => count + usage.messages, 0))} 条计量消息`);
  console.log(`缓存：创建 ${formatTokenCount(totalUsage.cacheCreationTokens)}，读取 ${formatTokenCount(totalUsage.cacheReadTokens)}`);
  console.log(`合计：消息 ${formatTokenCount(totalUsage.messages)}，总输入（含缓存） ${formatTokenCount(totalInputTokens)}，输出 ${formatTokenCount(totalUsage.outputTokens)}，总 Token ${formatTokenCount(totalTokens)}`);
  if (invalidLines > 0) {
    console.log(`⚠️ 已忽略 ${formatTokenCount(invalidLines)} 条无法解析的 JSONL 记录。`);
  }
  console.log('说明：仅汇总本地会话中的已知 usage 字段；不会采集、上传或估算费用。\n');
  return 0;
}

function formatTokenChange(baseline, candidate) {
  const delta = candidate - baseline;
  if (delta === 0) return '无变化';
  const direction = delta < 0 ? '减少' : '增加';
  const percentage = baseline === 0
    ? '基线为 0，无法计算比例'
    : `${delta > 0 ? '+' : '-'}${(Math.abs(delta) / baseline * 100).toFixed(1)}%`;
  return `${direction} ${formatTokenCount(Math.abs(delta))}（${percentage}）`;
}

/**
 * 比较两份由用户显式提供的会话摘要。
 * 只呈现实际差值；是否代表流程优化取决于调用者确认的可比性前提。
 */
function compareTelemetry(baselinePath, candidatePath) {
  if (!baselinePath || !candidatePath) {
    console.error('❌ telemetry compare 需要 <基线会话.jsonl> 和 <候选会话.jsonl> 参数。');
    return 1;
  }

  let baseline;
  let candidate;
  try {
    baseline = collectTelemetry(baselinePath);
    candidate = collectTelemetry(candidatePath);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    return 1;
  }

  console.log('\n📊 Token 遥测对比（仅本地只读）');
  console.log(`基线会话：${baseline.sessionName}，总 Token ${formatTokenCount(baseline.totalTokens)}`);
  console.log(`候选会话：${candidate.sessionName}，总 Token ${formatTokenCount(candidate.totalTokens)}`);
  console.log(`模型标识：基线 ${formatModelIdentifiers(baseline.models)}；候选 ${formatModelIdentifiers(candidate.models)}`);
  console.log(`总 Token：${formatTokenCount(baseline.totalTokens)} → ${formatTokenCount(candidate.totalTokens)}（${formatTokenChange(baseline.totalTokens, candidate.totalTokens)}）`);
  console.log(`总输入（含缓存）：${formatTokenCount(baseline.totalInputTokens)} → ${formatTokenCount(candidate.totalInputTokens)}（${formatTokenChange(baseline.totalInputTokens, candidate.totalInputTokens)}）`);
  console.log(`输出：${formatTokenCount(baseline.totalUsage.outputTokens)} → ${formatTokenCount(candidate.totalUsage.outputTokens)}（${formatTokenChange(baseline.totalUsage.outputTokens, candidate.totalUsage.outputTokens)}）`);
  if (baseline.invalidLines > 0 || candidate.invalidLines > 0) {
    console.log(`⚠️ 已忽略无法解析的 JSONL 记录：基线 ${formatTokenCount(baseline.invalidLines)} 条，候选 ${formatTokenCount(candidate.invalidLines)} 条。`);
  }
  if (baseline.models.size === 0 || candidate.models.size === 0) {
    console.log('⚠️ 至少一份会话未声明模型标识；请人工确认模型一致性。');
  } else if (formatModelIdentifiers(baseline.models) !== formatModelIdentifiers(candidate.models)) {
    console.log('⚠️ 检测到模型标识不同；Token 差异不能单独归因于流程改动。');
  }
  console.log('比较前提：仅当任务范围、模型、工具配置和完成标准一致时，以上变化才具有可比性。');
  console.log('说明：不会采集、上传、持久化会话内容，也不会自动判定流程优劣。\n');
  return 0;
}

// ============== 命令实现 ==============

/**
 * 文档一致性检查
 * 检查 proposal → spec → design → tasks 的需求映射是否完整
 */
function checkConsistency(changeName) {
  console.log(`\n🔍 检查变更: ${changeName}\n`);

  const changeDir = join(CHANGES_DIR, changeName);
  if (!existsSync(changeDir)) {
    console.error(`❌ 错误: 变更目录不存在: ${changeDir}`);
    process.exit(1);
  }

  const proposalPath = join(changeDir, 'proposal.md');
  const designPath = join(changeDir, 'design.md');
  const tasksPath = join(changeDir, 'tasks.md');
  const crossRefPath = join(changeDir, 'cross-reference.md');

  const deltaSpecsDir = join(changeDir, 'delta-specs');
  const deltaSpecs = existsSync(deltaSpecsDir) ? readdirSync(deltaSpecsDir).filter(d => 
    statSync(join(deltaSpecsDir, d)).isDirectory()
  ) : [];

  let allPassed = true;
  const results = [];

  // 1. 检查文件存在性
  console.log('📁 1. 文件存在性检查');
  const filesToCheck = [
    { name: 'proposal.md', path: proposalPath, required: true },
    { name: 'design.md', path: designPath, required: true },
    { name: 'tasks.md', path: tasksPath, required: true },
    { name: 'cross-reference.md', path: crossRefPath, required: true },
  ];

  for (const file of filesToCheck) {
    const exists = existsSync(file.path);
    const status = exists ? '✅' : (file.required ? '❌' : '⚠️');
    console.log(`  ${status} ${file.name}`);
    if (!exists && file.required) allPassed = false;
    results.push({ file: file.name, exists, required: file.required });
  }

  // 2. 检查 delta-specs
  console.log('\n📋 2. Delta Specs 检查');
  if (deltaSpecs.length === 0) {
    console.log('  ⚠️  未找到 delta-specs');
    allPassed = false;
  } else {
    for (const spec of deltaSpecs) {
      const specPath = join(deltaSpecsDir, spec, 'spec.md');
      const exists = existsSync(specPath);
      const status = exists ? '✅' : '❌';
      console.log(`  ${status} delta-specs/${spec}/spec.md`);
      if (!exists) allPassed = false;
    }
  }

  // 3. 检查 REQ-ID 一致性
  console.log('\n🔗 3. REQ-ID 一致性检查');
  const proposalContent = readMarkdown(proposalPath);
  const designContent = readMarkdown(designPath);
  const tasksContent = readMarkdown(tasksPath);
  const crossRefContent = readMarkdown(crossRefPath);

  const proposalReqs = extractReqIds(proposalContent);
  const designReqs = extractReqIds(designContent);
  const tasksReqs = extractReqIds(tasksContent);
  const crossRefReqs = extractReqIds(crossRefContent);

  let allDeltaReqs = [];
  for (const spec of deltaSpecs) {
    const specContent = readMarkdown(join(deltaSpecsDir, spec, 'spec.md'));
    allDeltaReqs = [...allDeltaReqs, ...extractReqIds(specContent)];
  }
  allDeltaReqs = [...new Set(allDeltaReqs)];

  const reqChecks = [
    { name: 'proposal', reqs: proposalReqs },
    { name: 'delta-specs', reqs: allDeltaReqs },
    { name: 'design', reqs: designReqs },
    { name: 'tasks', reqs: tasksReqs },
    { name: 'cross-reference', reqs: crossRefReqs },
  ];

  for (const check of reqChecks) {
    console.log(`  ${check.reqs.length > 0 ? '✅' : '⚠️'}  ${check.name}: ${check.reqs.length} 个 REQ`);
  }

  // Delta Spec 是需求来源；每个规划 artifact 都必须映射来源 REQ。
  if (allDeltaReqs.length > 0) {
    const mappingTargets = [
      { name: 'proposal.md', reqs: proposalReqs },
      { name: 'design.md', reqs: designReqs },
      { name: 'tasks.md', reqs: tasksReqs },
      { name: 'cross-reference.md', reqs: crossRefReqs },
    ];

    for (const target of mappingTargets) {
      const missingRequirements = allDeltaReqs.filter((requirement) => !target.reqs.includes(requirement));
      if (missingRequirements.length > 0) {
        console.log(`  ❌ ${target.name} 缺少 REQ: ${missingRequirements.join(', ')}`);
        allPassed = false;
      } else {
        console.log(`  ✅ delta-specs REQ 与 ${target.name} 一致`);
      }
    }
  }

  // 4. 检查任务完成度
  console.log('\n📝 4. 任务完成度检查');
  const allItems = extractChecklistItems(tasksContent);
  const completedItems = allItems.filter(i => i.startsWith('- [x]'));
  const totalItems = allItems.length;
  const completedCount = completedItems.length;
  const progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  console.log(`  📊 进度: ${completedCount}/${totalItems} (${progress}%)`);

  // 5. 生成报告
  console.log('\n📊' + '='.repeat(50));
  console.log('  一致性检查报告');
  console.log('='.repeat(50));
  
  if (allPassed) {
    console.log('\n✅ 所有检查通过！');
  } else {
    console.log('\n❌ 存在不一致问题，请检查上面的详细信息。');
  }

  console.log(`\n📁 变更目录: ${changeDir}`);
  console.log(`📝 需求数量: ${allDeltaReqs.length} 个`);
  console.log(`📊 任务进度: ${progress}%`);
  console.log('');

  return allPassed ? 0 : 1;
}

/**
 * 交付检查只在实现完成后使用。
 * 它在规划一致性之外，要求任务、需求追踪和结构化交付证明均已完成。
 */
function checkDelivery(changeName) {
  const changeDir = join(CHANGES_DIR, changeName);
  if (!existsSync(changeDir)) {
    console.error(`❌ 错误: 变更目录不存在: ${changeDir}`);
    return 1;
  }

  console.log(`\n🚚 检查交付: ${changeName}`);
  const consistencyStatus = checkConsistency(changeName);
  const errors = [];
  const tasksContent = readMarkdown(join(changeDir, 'tasks.md'));
  const taskItems = extractChecklistItems(tasksContent);
  if (taskItems.length === 0) {
    errors.push('tasks.md 缺少可执行 checklist');
  } else {
    const incompleteTasks = taskItems.filter((item) => item.startsWith('- [ ]'));
    if (incompleteTasks.length > 0) {
      errors.push(`tasks.md 存在 ${incompleteTasks.length} 项未完成任务`);
    }
  }

  const traceabilityEvidence = validateTraceabilityEvidence(changeDir);
  errors.push(...traceabilityEvidence.errors);

  const deliveryEvidence = validateDeliveryEvidence(changeDir);
  if (!deliveryEvidence.valid) {
    errors.push(...deliveryEvidence.errors);
  } else if (traceabilityEvidence.errors.length === 0) {
    errors.push(...validateDeliveryFingerprint(changeDir, deliveryEvidence.evidence, traceabilityEvidence.files));
  }

  console.log('\n📦 交付门槛结果');
  if (consistencyStatus === 0 && errors.length === 0) {
    console.log('✅ 交付检查通过：规划、任务、追踪和交付证明完整。\n');
    return 0;
  }
  if (consistencyStatus !== 0) {
    errors.unshift('规划工件一致性检查未通过');
  }
  for (const error of errors) {
    console.log(`  ❌ ${error}`);
  }
  console.log('❌ 交付检查失败：修复以上问题后才能归档或宣称本地交付完成。\n');
  return 1;
}

// ============== 流程执行审计 ==============

function collectTraceabilityRows(changeDir) {
  const traceability = readMarkdown(join(changeDir, 'traceability.md'));
  if (!traceability) return [];
  const rows = [];
  for (const line of traceability.split(/\r?\n/)) {
    if (!/^\|\s*REQ-\d+\s*\|/.test(line)) continue;
    const columns = line.split('|').slice(1, -1).map((column) => column.trim());
    if (columns.length < 5) continue;
    const splitPaths = (value) => value.split(',').map((path) => path.trim().replace(/^`|`$/g, '').replace(/:\d+$/, '')).filter(Boolean);
    rows.push({ id: columns[0], impl: splitPaths(columns[2]), test: splitPaths(columns[3]) });
  }
  return rows;
}

function countLines(relativePath) {
  try {
    return readFileSync(join(BASE_DIR, relativePath), 'utf8').split(/\r?\n/).length;
  } catch {
    return 0;
  }
}

function inferProcessLevel(changeDir, rows, isDocument = false) {
  const implFiles = [...new Set(rows.flatMap((row) => row.impl))];
  const totalLines = implFiles.reduce((sum, file) => sum + countLines(file), 0);
  const deltaSpecsDir = join(changeDir, 'delta-specs');
  const modules = existsSync(deltaSpecsDir)
    ? readdirSync(deltaSpecsDir).filter((module) => existsSync(join(deltaSpecsDir, module, 'spec.md')))
    : [];
  const taskItems = extractChecklistItems(readMarkdown(join(changeDir, 'tasks.md')) || '');
  const requirementIds = collectDeltaRequirementIds(changeDir);

  let level = 0;
  if (isDocument) {
    // 文档/技能类变更的实现文件即被修改的大文档，整文件行数会虚高级别；
    // 改用需求数、任务数、模块数推断，忽略 totalLines 信号。
    if (implFiles.length > 10 || requirementIds.length > 10) level = Math.max(level, 4);
    if (modules.length >= 3 || taskItems.length > 10) level = Math.max(level, 3);
    if (modules.length >= 2 || taskItems.length > 4 || requirementIds.length >= 3) level = Math.max(level, 2);
    if (implFiles.length > 1 || modules.length >= 1 || taskItems.length >= 1 || requirementIds.length >= 1) level = Math.max(level, 1);
  } else {
    if (totalLines >= 1000 || implFiles.length > 10 || requirementIds.length > 10) level = Math.max(level, 4);
    if (totalLines >= 200 || modules.length >= 3 || taskItems.length > 10) level = Math.max(level, 3);
    if (totalLines >= 50 || modules.length >= 2 || taskItems.length > 4 || requirementIds.length >= 3) level = Math.max(level, 2);
    if (totalLines >= 10 || implFiles.length > 1 || modules.length >= 1 || taskItems.length >= 1 || requirementIds.length >= 1) level = Math.max(level, 1);
  }
  return { level, signals: { totalLines, implFiles: implFiles.length, modules: modules.length, tasks: taskItems.length, reqs: requirementIds.length } };
}

function extractDeclaredLevel(changeDir) {
  const proposal = readMarkdown(join(changeDir, 'proposal.md')) || '';
  const declaration = readMarkdown(join(changeDir, 'process-declaration.md')) || '';
  const match = (declaration + '\n' + proposal).match(/声明级别[：:]\s*(L[0-4])|流程级别[：:]\s*(L[0-4])/);
  return match ? (match[1] || match[2]) : null;
}

function checkTddReferences(rows) {
  const issues = [];
  for (const row of rows) {
    for (const impl of row.impl) {
      const implBase = basename(impl).replace(/\.[^.]+$/, '').toLowerCase();
      const referenced = row.test.some((testPath) => {
        let content = '';
        try { content = readFileSync(join(BASE_DIR, testPath), 'utf8'); } catch {}
        const testBase = basename(testPath).replace(/\.[^.]+$/, '').toLowerCase();
        return testBase.includes(implBase) || content.toLowerCase().includes(implBase) || content.includes(impl);
      });
      if (!referenced) issues.push(`${row.id} 的测试未引用实现 ${impl}`);
    }
  }
  return issues;
}

function auditChange(changeName) {
  const changeDir = join(CHANGES_DIR, changeName);
  if (!existsSync(changeDir)) {
    console.error(`❌ 错误: 变更目录不存在: ${changeDir}`);
    return 1;
  }

  console.log(`\n🔎 流程执行审计: ${changeName}\n`);
  const errors = [];
  const warnings = [];

  const declarationPath = join(changeDir, 'process-declaration.md');
  if (!existsSync(declarationPath)) {
    errors.push('缺少 process-declaration.md 流程合规声明（须声明级别、遵循步骤、跳过步骤及理由）');
  } else {
    const declaration = readMarkdown(declarationPath);
    if (!/声明级别[：:]\s*L[0-4]/.test(declaration)) errors.push('process-declaration.md 缺少「声明级别」');
    if (!/遵循步骤/.test(declaration)) errors.push('process-declaration.md 缺少「遵循步骤」');
    if (!/跳过步骤|跳过|理由/.test(declaration)) errors.push('process-declaration.md 缺少「跳过步骤及理由」');
  }

  const rows = collectTraceabilityRows(changeDir);
  const delivery = loadDeliveryEvidence(changeDir);
  const isDocument = delivery.valid && delivery.evidence.profile === 'document';
  const inferred = inferProcessLevel(changeDir, rows, isDocument);
  console.log(`📡 信号: 实现文件 ${inferred.signals.implFiles} 个 / 共 ${inferred.signals.totalLines} 行 / 模块 ${inferred.signals.modules} 个 / 任务 ${inferred.signals.tasks} 项 / 需求 ${inferred.signals.reqs} 项`);
  console.log(`📐 推断最低级别: L${inferred.level}${isDocument ? '（document 变更，不计实现文件行数）' : ''}`);

  const declared = extractDeclaredLevel(changeDir);
  if (declared) {
    const declaredNumber = Number(declared[1]);
    if (declaredNumber < inferred.level) {
      errors.push(`级别路由不符：声明 ${declared} 低于推断最低级别 L${inferred.level}`);
    } else {
      console.log(`  ✅ 声明级别 ${declared} 不低于推断级别 L${inferred.level}`);
    }
  } else {
    warnings.push(`未声明级别，按推断级别 L${inferred.level} 校验`);
  }

  if (!isDocument) {
    const tddIssues = checkTddReferences(rows);
    for (const issue of tddIssues) errors.push(issue);
    if (tddIssues.length === 0 && rows.length > 0) console.log('  ✅ TDD 证据：每个需求均有测试引用实现');

    const reviewLevel = Math.max(inferred.level, declared ? Number(declared[1]) : 0);
    if (reviewLevel >= 2) {
      const hasReview = existsSync(join(changeDir, 'code-red-team-review.md'))
        || existsSync(join(changeDir, 'red-team-review.md'))
        || /审查/.test(readMarkdown(declarationPath) || '');
      if (hasReview) {
        console.log(`  ✅ 审查证据：L${reviewLevel} 需要审查记录，已存在`);
      } else {
        errors.push(`L${reviewLevel} 需要审查记录（code-red-team-review.md 或 red-team-review.md 或声明中的审查段）`);
      }
    }
  } else {
    const declaration = readMarkdown(declarationPath) || '';
    if (/用户确认/.test(declaration)) console.log('  ✅ 文档交付：已记录用户确认');
    else warnings.push('document 交付建议在 process-declaration.md 记录用户确认');
  }

  console.log('\n📊 审计结果');
  for (const warning of warnings) console.log(`  ⚠️  ${warning}`);
  for (const error of errors) console.log(`  ❌ ${error}`);
  if (errors.length === 0) {
    console.log('✅ 流程执行审计通过：过程合规、证据齐全。\n');
    return 0;
  }
  console.log('❌ 流程执行审计未通过：存在断链，修复后再宣称完成或归档。\n');
  return 1;
}

/**
 * 归档合并自动化
 * 识别创建模式，合并 delta-specs 到主规格，生成 merge-report
 */
function extractDeltaSection(content, type) {
  const match = content.match(new RegExp(`^## ${type} Requirements[^\\n]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'));
  return match ? match[1].trim() : '';
}

function extractDeltaRequirementBlocks(section, type) {
  if (!section || /^(无|none|n\/a)$/i.test(section.trim())) return [];
  const blocks = [];
  const pattern = /^### (REQ-\d+)(?::[^\n]*)?\n[\s\S]*?(?=^### REQ-\d+|^## |(?![\s\S]))/gm;
  let match;
  while ((match = pattern.exec(section)) !== null) {
    blocks.push({ id: match[1], content: match[0].trim() });
  }
  if (blocks.length === 0) {
    throw new Error(`${type} Requirements 必须使用 \`### REQ-编号: 标题\` 定义需求块`);
  }
  return blocks;
}

function findMasterRequirementBlock(content, requirementId) {
  const pattern = new RegExp(`^#### ${requirementId}(?::[^\\n]*)?\\n[\\s\\S]*?(?=^#### REQ-\\d+|^## |(?![\\s\\S]))`, 'm');
  const match = content.match(pattern);
  return match ? { index: match.index, content: match[0] } : null;
}

function normalizeMasterRequirementBlock(content) {
  return content
    .replace(/^### (REQ-\d+)/m, '#### $1')
    .replace(/\n---\s*$/, '')
    .trim();
}

function appendMasterRequirementBlock(content, block) {
  const boundary = content.search(/\n---\n\n## 3\./);
  if (boundary === -1) {
    throw new Error('主规格缺少功能规格到非功能性需求的标准边界');
  }
  return `${content.slice(0, boundary).trimEnd()}\n\n---\n\n${normalizeMasterRequirementBlock(block)}${content.slice(boundary)}`;
}

function updateMasterVersionAndHistory(content, changeName, date, changes) {
  const versionMatch = content.match(/> 版本：v(\d+)\.(\d+)/);
  if (!versionMatch) {
    throw new Error('主规格缺少 \`> 版本：vX.Y\` 元数据');
  }
  const nextVersion = `v${versionMatch[1]}.${Number(versionMatch[2]) + 1}`;
  const changeTypes = [...new Set(changes.map((change) => change.type))].join('/');
  const changeSummary = changes.map((change) => `${change.type} ${change.id}`).join('；');
  let updated = content.replace(/> 版本：v\d+\.\d+/, `> 版本：${nextVersion}`);
  updated = updated.replace(/(\| \*\*规格版本\*\* \| )v\d+\.\d+( \|)/, `$1${nextVersion}$2`);
  updated = updated.replace(/(\| \*\*最后更新\*\* \| )[^|]+( \|)/, `$1${date}$2`);
  updated = updated.replace(/(\*\*文档版本：\*\* )v\d+\.\d+/, `$1${nextVersion}`);
  updated = updated.replace(/(\*\*最后更新：\*\* )\d{4}-\d{2}-\d{2}/, `$1${date}`);
  const historyMarker = /\n---\n\n## 7\./;
  if (!historyMarker.test(updated)) {
    throw new Error('主规格缺少 §6 变更历史到 §7 术语表的标准边界');
  }
  updated = updated.replace(historyMarker, `\n| ${nextVersion} | ${date} | ${changeTypes} | ${changeSummary} | ${changeName} |\n---\n\n## 7.`);
  return { content: updated, version: nextVersion };
}

function prepareBrownfieldMerge(masterContent, deltaContent, changeName, date) {
  const changes = [];
  let merged = masterContent;
  const sectionTypes = ['ADDED', 'MODIFIED', 'REMOVED'];
  const sections = Object.fromEntries(sectionTypes.map((type) => [
    type,
    extractDeltaRequirementBlocks(extractDeltaSection(deltaContent, type), type),
  ]));

  for (const requirement of sections.ADDED) {
    if (findMasterRequirementBlock(merged, requirement.id)) {
      throw new Error(`ADDED ${requirement.id} 已存在于主规格`);
    }
    merged = appendMasterRequirementBlock(merged, requirement.content);
    changes.push({ id: requirement.id, type: 'ADDED' });
  }
  for (const requirement of sections.MODIFIED) {
    const existing = findMasterRequirementBlock(merged, requirement.id);
    if (!existing) {
      throw new Error(`MODIFIED ${requirement.id} 未存在于主规格`);
    }
    merged = `${merged.slice(0, existing.index)}${normalizeMasterRequirementBlock(requirement.content)}\n\n---\n\n${merged.slice(existing.index + existing.content.length)}`;
    changes.push({ id: requirement.id, type: 'MODIFIED' });
  }
  for (const requirement of sections.REMOVED) {
    const existing = findMasterRequirementBlock(merged, requirement.id);
    if (!existing) {
      throw new Error(`REMOVED ${requirement.id} 未存在于主规格`);
    }
    merged = `${merged.slice(0, existing.index)}${merged.slice(existing.index + existing.content.length)}`;
    changes.push({ id: requirement.id, type: 'REMOVED' });
  }
  if (changes.length === 0) {
    throw new Error('Brownfield Delta 未定义 ADDED、MODIFIED 或 REMOVED 需求');
  }
  const versioned = updateMasterVersionAndHistory(merged, changeName, date, changes);
  return { ...versioned, changes };
}

function archiveChange(changeName) {
  console.log(`\n📦 归档变更: ${changeName}\n`);

  const changeDir = join(CHANGES_DIR, changeName);
  if (!existsSync(changeDir)) {
    console.error(`❌ 错误: 变更目录不存在: ${changeDir}`);
    process.exit(1);
  }

  if (checkDelivery(changeName) !== 0) {
    console.log('ℹ️  交付门槛未通过：未写入主规格、未生成归档报告，也未移动变更目录。');
    return 1;
  }

  if (auditChange(changeName) !== 0) {
    console.log('ℹ️  流程审计未通过：未写入主规格、未生成归档报告，也未移动变更目录。');
    return 1;
  }

  // 1. 读取创建模式
  const proposalPath = join(changeDir, 'proposal.md');
  const proposalContent = readMarkdown(proposalPath);
  let mode = 'unknown';
  
  if (proposalContent) {
    if (proposalContent.includes('Greenfield') || proposalContent.includes('首次创建')) {
      mode = 'greenfield';
    } else if (proposalContent.includes('Brownfield') || proposalContent.includes('后续修改')) {
      mode = 'brownfield';
    } else if (proposalContent.includes('Mixed') || proposalContent.includes('混合')) {
      mode = 'mixed';
    }
  }

  console.log(`📋 模式判定: ${mode}`);

  // 2. 查找 delta-specs
  const deltaSpecsDir = join(changeDir, 'delta-specs');
  const modules = existsSync(deltaSpecsDir) ? readdirSync(deltaSpecsDir).filter(d => 
    statSync(join(deltaSpecsDir, d)).isDirectory()
  ) : [];

  console.log(`📦 涉及模块: ${modules.join(', ')}`);

  // 3. 先完成所有模块的预检和内存合并，避免任一模块失败时留下部分主规格写入。
  const reportDate = new Date().toISOString().split('T')[0];
  const archiveDir = join(CHANGES_DIR, 'archive');
  const archiveName = `${reportDate}-${changeName}`;
  const archivePath = join(archiveDir, archiveName);
  if (existsSync(archivePath)) {
    console.log(`❌ 归档目标已存在：${archivePath}`);
    console.log('ℹ️  本次未生成交付或合并报告、未写入主规格，也未移动变更目录。');
    return 1;
  }
  const mergeErrors = [];
  const mergePlan = modules.map((module) => {
    const deltaSpecPath = join(deltaSpecsDir, module, 'spec.md');
    const masterSpecPath = join(SPECS_DIR, module, 'spec.md');
    const masterSpecExists = existsSync(masterSpecPath);
    let subMode = mode;
    if (mode === 'mixed' || mode === 'unknown') {
      subMode = masterSpecExists ? 'brownfield' : 'greenfield';
    }

    if (subMode === 'greenfield' && masterSpecExists) {
      mergeErrors.push(`${module}: Greenfield 变更不能覆盖既有主规格`);
      return { module, deltaSpecPath, masterSpecPath, masterSpecExists, subMode, valid: false };
    }
    if (subMode === 'brownfield' && !masterSpecExists) {
      mergeErrors.push(`${module}: Brownfield 变更缺少既有主规格`);
      return { module, deltaSpecPath, masterSpecPath, masterSpecExists, subMode, valid: false };
    }
    const deltaContent = readMarkdown(deltaSpecPath);
    if (!deltaContent) {
      mergeErrors.push(`${module}: 缺少 delta-specs/${module}/spec.md`);
      return { module, deltaSpecPath, masterSpecPath, masterSpecExists, subMode, valid: false };
    }
    try {
      if (subMode === 'greenfield') {
        const requirements = extractReqIds(deltaContent);
        return {
          module, deltaSpecPath, masterSpecPath, masterSpecExists, subMode, valid: true,
          mergedContent: generateMasterSpec(module, deltaContent, changeName, requirements),
          version: 'v1.0', changes: requirements.map((id) => ({ id, type: 'ADDED' })),
        };
      }
      const brownfield = prepareBrownfieldMerge(readMarkdown(masterSpecPath), deltaContent, changeName, reportDate);
      return { module, deltaSpecPath, masterSpecPath, masterSpecExists, subMode, valid: true, mergedContent: brownfield.content, version: brownfield.version, changes: brownfield.changes, previousContent: readMarkdown(masterSpecPath) };
    } catch (error) {
      mergeErrors.push(`${module}: ${error.message}`);
      return { module, deltaSpecPath, masterSpecPath, masterSpecExists, subMode, valid: false };
    }
  });

  if (mergeErrors.length > 0) {
    console.log('\n❌ 主规格合并预检失败：');
    for (const error of mergeErrors) {
      console.log(`  - ${error}`);
    }
    console.log('\nℹ️  本次未写入主规格、未生成归档报告，也未移动变更目录。');
    return 1;
  }

  // 4. 所有模块均可自动合并后，才开始写入与归档。
  const deliveryEvidence = validateDeliveryEvidence(changeDir);
  const deliveryReportPath = writeDeliveryReport(changeDir, changeName, deliveryEvidence.evidence);
  console.log(`\n📄 生成本地交付报告: ${deliveryReportPath}`);
  const mergeActions = [];
  const snapshotDir = join(changeDir, '.powersnexus', 'pre-merge-snapshot');

  for (const item of mergePlan) {
    const { module, masterSpecPath, masterSpecExists, subMode } = item;

    console.log(`\n📁 处理模块: ${module}`);
    console.log(`  主规格状态: ${masterSpecExists ? '已存在' : '不存在'}`);
    console.log(`  子模式: ${subMode}`);

    ensureDir(join(SPECS_DIR, module));
    if (item.previousContent) {
      ensureDir(snapshotDir);
      writeFileSync(join(snapshotDir, `${module}.spec.md`), item.previousContent, 'utf8');
    }
    writeFileSync(masterSpecPath, item.mergedContent, 'utf-8');

    console.log(`  ✅ ${subMode === 'greenfield' ? '创建' : '更新'}主规格: ${masterSpecPath}`);
    mergeActions.push({ module, mode: subMode, action: subMode === 'greenfield' ? 'created' : 'updated', version: item.version, changes: item.changes });
  }

  // 5. 生成 merge-report.md
  const reportContent = generateMergeReport(changeName, mode, mergeActions, reportDate);
  const reportPath = join(changeDir, 'merge-report.md');
  writeFileSync(reportPath, reportContent, 'utf-8');
  console.log(`\n📄 生成合并报告: ${reportPath}`);

  // 6. 移动到 archive
  ensureDir(archiveDir);
  let archiveMoveFailed = false;

  try {
    renameSync(changeDir, archivePath);
    console.log(`✅ 已移动到归档: ${archivePath}`);
  } catch (e) {
    console.log(`⚠️  移动到归档失败: ${e.message}`);
    console.log(`ℹ️  请手动移动: ${changeDir} → ${archivePath}`);
    archiveMoveFailed = true;
  }

  console.log('\n📊 归档完成！');
  console.log(`  模式: ${mode}`);
  console.log(`  模块数: ${modules.length}`);
  console.log(`  动作数: ${mergeActions.length}`);
  console.log('');

  return archiveMoveFailed ? 1 : 0;
}

/**
 * 生成主规格内容（简化版）
 */
function generateMasterSpec(module, deltaContent, changeName, requirements) {
  const today = new Date().toISOString().split('T')[0];
  
  // 提取 ADDED 部分
  const addedMatch = deltaContent.match(/## ADDED Requirements([\s\S]*?)(## |$)/);
  const addedContent = addedMatch ? addedMatch[1] : deltaContent;

  const requirementSummary = requirements.length > 0
    ? requirements.join(', ')
    : '本次 Delta Spec 未声明 REQ-ID';

  return `# Master Specification: ${module}

> 路径：.novaway/powersnexus/specs/${module}/spec.md
> 用途：项目主规格（单一事实来源）
> 版本：v1.0
> 状态：Active
> 创建模式：Greenfield（首次创建）
> 来源变更：${changeName}

---

## Metadata

| 字段 | 内容 |
|------|------|
| **模块名称** | ${module} |
| **规格版本** | v1.0 |
| **创建日期** | ${today} |
| **最后更新** | ${today} |
| **负责团队** | AI Agent + Human Partner |
| **变更历史** | 见 §6 |

---

## 1. 模块概述

本规格由变更 \`${changeName}\` 的 Delta Spec 自动创建，覆盖模块 \`${module}\` 在本次变更中新增的需求。

本次识别的需求：${requirementSummary}。

---

## 2. 功能规格

### 2.2 详细需求

${addedContent}

---

## 3. 非功能性需求

本次 Delta Spec 未显式定义额外的非功能性需求；后续变更如有性能、可用性或运行环境约束，应以新的 Delta Spec 更新本主规格。

---

## 4. 架构设计

架构决策以变更目录 \`.novaway/powersnexus/changes/${changeName}/design.md\` 为准。归档过程保留该来源引用，不复制或推测未在 Delta Spec 中声明的设计细节。

---

## 5. 数据模型

本次 Delta Spec 未声明独立的数据模型变更。

---

## 6. 变更历史

| 版本 | 日期 | 变更类型 | 变更说明 | 关联变更 |
|------|------|----------|----------|----------|
| v1.0 | ${today} | INITIAL | 首次创建 | ${module} |

---

## 7. 术语表

| 术语 | 定义 |
|------|------|
| Delta Spec | 记录本次变更新增或调整需求的规格文件 |

---

**文档版本：** v1.0
**创建日期：** ${today}
**最后更新：** ${today}
`;
}

/**
 * 生成合并报告
 */
function generateMergeReport(changeName, mode, actions, date) {
  const requirementRows = actions.flatMap((action) => action.changes.map((change) => (
    `| ${change.type === 'ADDED' ? '-' : change.id} | ${change.type === 'REMOVED' ? '-' : change.id} | ${change.type} | ${action.module} 主规格已${action.action === 'created' ? '创建' : '更新'} |`
  )));
  const requirementMapping = requirementRows.length > 0
    ? requirementRows.join('\n')
    : '| 未声明 REQ-ID | - | ADDED | Delta Spec 未声明 REQ-ID |';

  return `# Merge Report: ${changeName}

> 归档日期：${date}
> 创建模式：${mode}
> 用途：归档阶段记录本次变更的合并动作

---

## 元信息

| 字段 | 内容 |
|------|------|
| **变更名称** | ${changeName} |
| **归档日期** | ${date} |
| **创建模式** | ${mode} |
| **涉及模块数** | ${actions.length} |

---

## 合并动作详情

${actions.map((a, i) => `### ${i + 1}. ${a.module}

| 项目 | 内容 |
|------|------|
| **子模式** | ${a.mode} |
| **动作** | ${a.action} |
| **版本** | ${a.version || '-'} |

`).join('')}

---

## REQ-ID 映射

| 旧 REQ-ID | 新 REQ-ID | 变更类型 | 说明 |
|-----------|-----------|----------|------|
${requirementMapping}

---

## 冲突处理

| 冲突类型 | 状态 | 处理方式 |
|----------|------|----------|
| Greenfield 但 specs/ 已存在 | 无冲突 | - |
| Brownfield 但 specs/ 不存在 | 无冲突 | - |
| REQ-ID 冲突 | 无冲突 | - |

---

## 合并后状态

- [x] 所有 artifacts 已归档
- [x] 主规格已更新或新建
- [x] 变更历史已追加
- [x] 归档报告已记录

---

**报告生成时间：** ${new Date().toISOString()}
**生成者：** powersnexus-cli
`;
}

/**
 * 流程启动器
 * 评估任务规模，推荐 L0-L4 流程
 */
function startTask(taskDesc, forcedLevel) {
  console.log(`\n🚀 PowersNexus 流程启动器\n`);
  console.log(`任务描述: ${taskDesc}\n`);

  // 简单的启发式评估
  let level = 'L2';
  let levelName = '标准流程';
  let confidence = 70;

  const lowerDesc = taskDesc.toLowerCase();

  // L0 特征
  if (lowerDesc.includes('typo') || lowerDesc.includes('拼写') || 
      lowerDesc.includes('文案') || lowerDesc.includes('配置') ||
      lowerDesc.includes('改个') || lowerDesc.includes('修复一个字')) {
    level = 'L0';
    levelName = '微型修复';
    confidence = 95;
  }
  // L1 特征
  else if (lowerDesc.includes('小功能') || lowerDesc.includes('小优化') ||
           lowerDesc.includes('小 bug') || lowerDesc.includes('修复') ||
           lowerDesc.includes('简单') || lowerDesc.includes('quick')) {
    level = 'L1';
    levelName = '快速迭代';
    confidence = 85;
  }
  // L4 特征
  else if (lowerDesc.includes('核心架构') || lowerDesc.includes('重大重构') ||
           lowerDesc.includes('系统级') || lowerDesc.includes('重量级')) {
    level = 'L4';
    levelName = '重量级';
    confidence = 90;
  }
  // L3 特征
  else if (lowerDesc.includes('大型') || lowerDesc.includes('架构') ||
           lowerDesc.includes('重构') || lowerDesc.includes('跨模块') ||
           lowerDesc.includes('完整流程')) {
    level = 'L3';
    levelName = '完整流程';
    confidence = 80;
  }

  if (forcedLevel) {
    level = forcedLevel;
    levelName = PROCESS_LEVELS[level].name;
    confidence = 100;
  }

  // 轨道检测：非编码关键词 → 非编码轨道（document 交付）
  const NON_CODING_KEYWORDS = ['文档', 'prd', '需求文档', '调研', '数据分析', '报表', '运营', '写作', '方案'];
  const isNonCoding = NON_CODING_KEYWORDS.some((keyword) => lowerDesc.includes(keyword));
  const track = isNonCoding ? '非编码轨道（grill-me → document 交付）' : `编码轨道（L${level.replace('L', '')}，按规模分级）`;

  console.log(`📊 评估结果：`);
  console.log(`  推荐轨道: ${track}`);
  console.log(`  推荐级别: ${level} - ${levelName}`);
  console.log(`  置信度: ${confidence}%`);
  console.log('');
  console.log(`📋 流程概览：`);

  const info = PROCESS_LEVELS[level];
  console.log(`  核心步骤: ${info.steps}`);
  console.log(`  文档产出: ${info.docs}`);
  console.log(`  预计耗时: ${info.time}`);
  console.log(`  技能激活: ${info.activation}`);
  console.log(`  Token 预算: ${info.tokenBudget}`);
  console.log('');

  if (forcedLevel) {
    console.log(`💡 已按 --level ${forcedLevel} 覆盖自动评估。`);
  } else {
    console.log(`💡 提示：这是初步评估，实际级别可能需要调整。`);
    console.log(`   使用 --level L1 强制指定级别`);
  }
  console.log('');

  return 0;
}

/**
 * 需求追踪自动生成
 */
function generateTrace(changeName) {
  console.log(`\n🔗 生成需求追踪: ${changeName}\n`);

  const changeDir = join(CHANGES_DIR, changeName);
  if (!existsSync(changeDir)) {
    console.error(`❌ 错误: 变更目录不存在: ${changeDir}`);
    process.exit(1);
  }

  // 读取 delta-specs
  const deltaSpecsDir = join(changeDir, 'delta-specs');
  const modules = existsSync(deltaSpecsDir) ? readdirSync(deltaSpecsDir).filter(d => 
    statSync(join(deltaSpecsDir, d)).isDirectory()
  ) : [];

  console.log(`📦 涉及模块: ${modules.join(', ')}`);

  // 提取所有 REQ
  let allReqs = [];
  for (const module of modules) {
    const specPath = join(deltaSpecsDir, module, 'spec.md');
    const content = readMarkdown(specPath);
    const reqs = extractReqIds(content);
    allReqs = [...allReqs, ...reqs.map(r => ({ id: r, module }))];
  }

  console.log(`📝 需求数量: ${allReqs.length}`);
  console.log('');

  // 生成追踪表
  console.log('📊 需求追踪表:');
  console.log('');
  console.log('| REQ-ID | 模块 | 代码实现 | 测试覆盖 | 状态 |');
  console.log('|--------|------|----------|----------|------|');
  
  for (const req of allReqs) {
    console.log(`| ${req.id} | ${req.module} | 待实现 | 待测试 | ⏳ 待开始 |`);
  }

  const tracePath = join(changeDir, 'traceability.md');
  const traceContent = `# 需求追踪表：${changeName}

> 来源：\`.novaway/powersnexus/changes/${changeName}/delta-specs/\`
> 用途：记录需求与代码实现、测试覆盖状态的对应关系

| REQ-ID | 模块 | 代码实现 | 测试覆盖 | 状态 |
|--------|------|----------|----------|------|
${allReqs.map((req) => `| ${req.id} | ${req.module} | 待实现 | 待测试 | ⏳ 待开始 |`).join('\n')}
`;
  writeFileSync(tracePath, traceContent, 'utf-8');

  console.log('');
  console.log('✅ 追踪表生成完成！');
  console.log(`📄 已写入: ${tracePath}`);
  console.log('   请手动补充代码实现和测试覆盖信息。');
  console.log('');

  return 0;
}

/**
 * 轻量状态路由
 * 只根据已有工件给出唯一下一步，不创建额外状态文件。
 */
function recommendNext(changeName) {
  const changeDir = join(CHANGES_DIR, changeName);
  if (!existsSync(changeDir)) {
    console.error(`❌ 错误: 变更目录不存在: ${changeDir}`);
    return 1;
  }

  const recommend = (message, command) => {
    console.log(`\n🧭 变更路由: ${changeName}`);
    console.log(`下一步：${message}`);
    console.log(`建议命令：${command}\n`);
    return 0;
  };
  const proposalPath = join(changeDir, 'proposal.md');
  const designPath = join(changeDir, 'design.md');
  const tasksPath = join(changeDir, 'tasks.md');
  const crossReferencePath = join(changeDir, 'cross-reference.md');
  const traceabilityPath = join(changeDir, 'traceability.md');
  const deltaSpecsDir = join(changeDir, 'delta-specs');
  const deltaModules = existsSync(deltaSpecsDir)
    ? readdirSync(deltaSpecsDir).filter((module) => existsSync(join(deltaSpecsDir, module, 'spec.md')))
    : [];

  if (!existsSync(proposalPath)) {
    return recommend('创建 proposal.md，明确目标、范围和创建模式。', '使用 brainstorming 或 OpenSpec 编写 proposal.md');
  }
  if (deltaModules.length === 0) {
    return recommend('创建至少一个 delta-specs/<模块>/spec.md，并声明 REQ-ID。', '创建 delta-specs 后运行 powersnexus next ' + changeName);
  }
  if (!existsSync(designPath)) {
    return recommend('编写 design.md，说明技术方案和约束。', '完成 design.md 后运行 powersnexus next ' + changeName);
  }
  if (!existsSync(tasksPath)) {
    return recommend('编写 tasks.md，拆分可验证的实现任务。', '完成 tasks.md 后运行 powersnexus next ' + changeName);
  }
  if (!existsSync(crossReferencePath)) {
    return recommend('编写 cross-reference.md，映射 REQ、设计和任务。', '完成 cross-reference.md 后运行 powersnexus next ' + changeName);
  }
  if (!existsSync(traceabilityPath)) {
    return recommend('生成需求追踪表。', `powersnexus trace ${changeName}`);
  }

  const taskItems = extractChecklistItems(readMarkdown(tasksPath));
  const completedTasks = taskItems.filter((item) => item.startsWith('- [x]')).length;
  if (taskItems.length === 0) {
    return recommend('为 tasks.md 补充可执行 checklist。', '补充任务后运行 powersnexus next ' + changeName);
  }
  if (completedTasks < taskItems.length) {
    return recommend(`继续执行 tasks.md 中未完成的任务（${completedTasks}/${taskItems.length}）。`, '完成任务后运行 powersnexus next ' + changeName);
  }

  const traceabilityEvidence = validateTraceabilityEvidence(changeDir);
  if (traceabilityEvidence.errors.length > 0) {
    return recommend('补全需求追踪表中的实现、测试路径和完成状态。', `完善 traceability.md 后运行 powersnexus next ${changeName}`);
  }

  const deliveryConfiguration = validateDeliveryEvidence(changeDir, { requireExecution: false });
  if (!deliveryConfiguration.valid) {
    return recommend('初始化并填写 delivery.json，使用 application/library/web profile 配置真实 argv 命令数组，非编码工作使用 document profile。', `powersnexus init delivery ${changeName} --profile application`);
  }
  const deliveryEvidence = validateDeliveryEvidence(changeDir);
  if (!deliveryEvidence.valid) {
    return recommend('显式执行本地构建、测试、集成和运行验证。', `powersnexus verify delivery ${changeName}`);
  }
  if (validateDeliveryFingerprint(changeDir, deliveryEvidence.evidence, traceabilityEvidence.files).length > 0) {
    return recommend('交付输入已变化，重新执行本地验证以刷新证据。', `powersnexus verify delivery ${changeName}`);
  }

  return recommend('运行流程审计和交付检查；通过后归档变更。', `powersnexus audit ${changeName} && powersnexus check delivery ${changeName} && powersnexus archive ${changeName}`);
}

/**
 * 显式会话恢复点
 * 仅在用户要求时保存当前任务和下一步，不参与自动流程路由。
 */
function manageCheckpoint(action, changeName, args) {
  const changeDir = join(CHANGES_DIR, changeName || '');
  if (!changeName || !existsSync(changeDir)) {
    console.error(`❌ 错误: 变更目录不存在: ${changeDir}`);
    return 1;
  }

  const checkpointDir = join(changeDir, '.powersnexus');
  const checkpointPath = join(checkpointDir, 'checkpoints.json');
  if (action === 'list') {
    if (!existsSync(checkpointPath)) {
      console.log(`\n📌 ${changeName} 暂无 checkpoint。\n`);
      return 0;
    }
    try {
      const checkpoints = readJsonWithoutBom(checkpointPath);
      if (!Array.isArray(checkpoints) || checkpoints.length === 0) {
        console.log(`\n📌 ${changeName} 暂无 checkpoint。\n`);
        return 0;
      }
      console.log(`\n📌 ${changeName} 的 checkpoint：`);
      for (const checkpoint of checkpoints) {
        console.log(`- ${checkpoint.id} | ${checkpoint.timestamp} | 任务：${checkpoint.task} | 下一步：${checkpoint.next}`);
      }
      console.log('');
      return 0;
    } catch (error) {
      console.error(`❌ 无法读取 checkpoint：${error.message}`);
      return 1;
    }
  }

  if (action !== 'save') {
    console.error('❌ checkpoint 仅支持 save 或 list。');
    return 1;
  }

  const taskIndex = args.indexOf('--task');
  const nextIndex = args.indexOf('--next');
  const task = taskIndex === -1 ? '' : args[taskIndex + 1] || '';
  const next = nextIndex === -1 ? '' : args[nextIndex + 1] || '';
  if (!task || !next) {
    console.error('❌ checkpoint save 需要 --task <任务标识> 和 --next <下一步说明>。');
    return 1;
  }

  let checkpoints = [];
  if (existsSync(checkpointPath)) {
    try {
      const existing = readJsonWithoutBom(checkpointPath);
      if (!Array.isArray(existing)) {
        throw new Error('根节点必须是数组');
      }
      checkpoints = existing;
    } catch (error) {
      console.error(`❌ 无法读取 checkpoint：${error.message}`);
      return 1;
    }
  }

  const checkpoint = {
    id: `checkpoint-${Date.now()}`,
    timestamp: new Date().toISOString(),
    task,
    next,
  };
  checkpoints.push(checkpoint);
  ensureDir(checkpointDir);
  writeFileSync(checkpointPath, `${JSON.stringify(checkpoints, null, 2)}\n`, 'utf-8');
  console.log(`\n✅ 已保存 checkpoint：${checkpoint.id}`);
  console.log(`📄 路径：${checkpointPath}\n`);
  return 0;
}

/**
 * 安装包健康检查
 * 检查跨平台清单、运行时入口和关键技能是否完整。
 */
function doctor() {
  console.log(`\n🩺 PowersNexus 健康检查 v${PACKAGE_VERSION}\n`);

  const manifestChecks = [
    { name: 'package.json', path: 'package.json', versionOf: (json) => json.version },
    { name: 'Claude 插件清单', path: '.claude-plugin/plugin.json', versionOf: (json) => json.version },
    { name: 'Claude 市场清单', path: '.claude-plugin/marketplace.json', versionOf: (json) => json.plugins?.[0]?.version },
    { name: 'Codex 插件清单', path: '.codex-plugin/plugin.json', versionOf: (json) => json.version },
    { name: 'Cursor 插件清单', path: '.cursor-plugin/plugin.json', versionOf: (json) => json.version },
    { name: 'Kimi 插件清单', path: '.kimi-plugin/plugin.json', versionOf: (json) => json.version },
    { name: 'Gemini 扩展清单', path: 'gemini-extension.json', versionOf: (json) => json.version },
  ];
  const runtimeChecks = [
    ['OpenCode 插件入口', '.opencode/plugins/powersnexus.js'],
    ['Pi 扩展入口', '.pi/extensions/powersnexus.ts'],
    ['启动技能', 'skills/using-powersnexus/SKILL.md'],
    ['Bridge 机器协议', 'src/bridge/index.js'],
    ['Bridge 协议 Schema', 'schemas/protocol-v1.json'],
    ['更新 Manifest Schema', 'schemas/update-manifest-v1.json'],
    ['Web 交付 Profile', 'profiles/web.json'],
    ['前端质量技能', 'skills/frontend-quality/SKILL.md'],
    ['UI/UX 设计技能', 'skills/ui-ux-pro-max/SKILL.md'],
    ['UI/UX 样式数据', 'skills/ui-ux-pro-max/data/styles.csv'],
  ];

  let passed = 0;
  let failed = 0;
  const pass = (message) => {
    console.log(`  ✅ ${message}`);
    passed++;
  };
  const fail = (message) => {
    console.log(`  ❌ ${message}`);
    failed++;
  };

  console.log('📦 平台清单');
  for (const manifest of manifestChecks) {
    const manifestPath = join(PACKAGE_ROOT, manifest.path);
    if (!existsSync(manifestPath)) {
      fail(`${manifest.name} 缺失：${manifest.path}`);
      continue;
    }
    try {
      const version = manifest.versionOf(readJsonWithoutBom(manifestPath));
      if (version === PACKAGE_VERSION) {
        pass(`${manifest.name} 版本为 ${PACKAGE_VERSION}`);
      } else {
        fail(`${manifest.name} 版本不一致：${version || '未声明'}，期望 ${PACKAGE_VERSION}`);
      }
    } catch (error) {
      fail(`${manifest.name} 无法读取：${error.message}`);
    }
  }

  console.log('\n⚙️ 运行时资源');
  for (const [name, relativePath] of runtimeChecks) {
    if (existsSync(join(PACKAGE_ROOT, relativePath))) {
      pass(`${name} 可用`);
    } else {
      fail(`${name} 缺失：${relativePath}`);
    }
  }

  console.log(`\n📊 结果：${passed} 通过，${failed} 失败`);
  if (failed === 0) {
    console.log('✅ PowersNexus 安装状态正常。\n');
    return 0;
  }

  console.log('❌ 请重新安装或修复缺失的运行时资源。\n');
  return 1;
}

// ============== 主入口 ==============

function printHelp() {
  console.log(`
PowersNexus CLI - 自动化工具集 v${PACKAGE_VERSION}

用法:
  powersnexus <command> [options]

命令:
  check consistency <change-name>   规划工件一致性检查
  check delivery <change-name>      归档前交付门槛检查
  verify delivery <change-name>     显式执行 delivery.json 中的本地验证命令
  audit <change-name>               归档前流程执行审计（级别路由/TDD/审查/合规声明）
  init delivery <change-name> [--profile application|library|web|document]
                                      初始化交付命令契约（不覆盖已有文件）
  archive <change-name>             归档合并自动化
  start <task-description> [--level L0-L4]
                                      流程启动器（评估任务规模）
  trace <change-name>               需求追踪自动生成
  next <change-name>                根据现有工件建议唯一下一步
  telemetry <session-file.jsonl>    只读汇总本地会话的 Token 使用量
  telemetry compare <baseline> <candidate>
                                      对比两份本地会话的实际 Token 差异
  checkpoint save <change> --task <id> --next <text>
                                      显式保存长任务恢复点
  checkpoint list <change>          列出保存的恢复点
  bridge inspect --change <name> --format json
                                      输出版本化工作流快照
  bridge validate --change <name> --format json
                                      输出机器可读工件校验结果
  bridge transition --change <name> --format jsonl [--request file]
                                      从 stdin 或文件接收幂等 Action 请求
  doctor                            安装与运行时健康检查
  help                              显示帮助信息

示例:
  powersnexus check consistency my-feature
  powersnexus check delivery my-feature
  powersnexus verify delivery my-feature
  powersnexus audit my-feature
  powersnexus init delivery my-feature --profile application
  powersnexus archive my-feature
  powersnexus start "添加用户登录功能"
  powersnexus trace my-feature
  powersnexus next my-feature
  powersnexus telemetry ./session.jsonl
  powersnexus telemetry compare ./baseline.jsonl ./candidate.jsonl
  powersnexus checkpoint save my-feature --task 2.1 --next "运行聚焦测试"
  powersnexus bridge inspect --change my-feature --format json
  powersnexus doctor
`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    process.exit(0);
  }

  const command = args[0];
  const subCommand = args[1];
  const arg = args[2] || args[1];

  switch (command) {
    case 'check':
      if (subCommand === 'consistency') {
        process.exit(checkConsistency(arg));
      } else if (subCommand === 'delivery') {
        process.exit(checkDelivery(arg));
      } else {
        console.error(`❌ 未知检查命令: ${subCommand}`);
        console.log('可用命令: consistency, delivery');
        process.exit(1);
      }
      break;

    case 'verify':
      if (subCommand === 'delivery') {
        process.exit(verifyDelivery(arg));
      } else {
        console.error(`❌ 未知验证命令: ${subCommand}`);
        console.log('可用命令: delivery');
        process.exit(1);
      }
      break;

    case 'init':
      if (subCommand === 'delivery') {
        process.exit(initializeDelivery(args[2], args.slice(3)));
      } else {
        console.error(`❌ 未知初始化命令: ${subCommand}`);
        console.log('可用命令: delivery');
        process.exit(1);
      }
      break;

    case 'archive':
      process.exit(archiveChange(subCommand));
      break;

    case 'start':
      const startArgs = args.slice(1);
      const levelIndex = startArgs.indexOf('--level');
      let forcedLevel;
      if (levelIndex !== -1) {
        forcedLevel = startArgs[levelIndex + 1];
        if (!PROCESS_LEVELS[forcedLevel]) {
          console.error('❌ --level 仅支持 L0、L1、L2、L3 或 L4');
          process.exit(1);
        }
        startArgs.splice(levelIndex, 2);
      }
      const taskDesc = startArgs.join(' ');
      process.exit(startTask(taskDesc, forcedLevel));
      break;

    case 'trace':
      process.exit(generateTrace(subCommand));
      break;

    case 'next':
      process.exit(recommendNext(subCommand));
      break;

    case 'audit':
      process.exit(auditChange(subCommand));
      break;

    case 'telemetry':
      if (subCommand === 'compare') {
        process.exit(compareTelemetry(args[2], args[3]));
      }
      process.exit(analyzeTelemetry(subCommand));
      break;

    case 'checkpoint':
      process.exit(manageCheckpoint(subCommand, args[2], args.slice(3)));
      break;

    case 'bridge':
      process.exit(bridgeCommand(subCommand, args.slice(2)));
      break;

    case 'doctor':
      process.exit(doctor());
      break;

    default:
      console.error(`❌ 未知命令: ${command}`);
      console.log('使用 "powersnexus help" 查看可用命令');
      process.exit(1);
  }
}

main();
