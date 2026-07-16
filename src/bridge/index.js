import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';

export const PROTOCOL_VERSION = '1.0';
export const BRIDGE_EXIT = Object.freeze({
  OK: 0,
  INVALID_REQUEST: 2,
  CONFLICT: 3,
  NOT_FOUND: 4,
  INTERNAL: 5,
});

const CHANGE_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]{0,127}$/;
const PHASE_ACTIONS = Object.freeze({
  needs_proposal: 'create_artifacts',
  needs_spec: 'create_artifacts',
  needs_design: 'create_artifacts',
  needs_plan: 'create_plan',
  implementing: 'start_implementation',
  needs_traceability: 'reconcile_tasks',
  needs_delivery_config: 'configure_delivery',
  ready_to_verify: 'verify',
  ready_to_archive: 'archive',
  completed: null,
});

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

function readText(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

function readJson(path) {
  const content = readFileSync(path, 'utf8');
  if (content.charCodeAt(0) === 0xfeff) throw new Error(`${basename(path)} 包含 UTF-8 BOM`);
  return JSON.parse(content);
}

function atomicWriteJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  renameSync(temporaryPath, path);
}

function normalizeChangeName(changeName) {
  if (!CHANGE_NAME_PATTERN.test(changeName || '')) {
    throw bridgeError('CHANGE_NAME_INVALID', 'changeName 仅允许小写字母、数字、点、下划线和连字符。', BRIDGE_EXIT.INVALID_REQUEST);
  }
  return changeName;
}

function bridgeError(code, message, exitCode, evidence = []) {
  return Object.assign(new Error(message), { code, exitCode, evidence });
}

function listFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) files.push(path);
    }
  };
  visit(root);
  return files.sort((left, right) => left.localeCompare(right, 'en'));
}

function collectArtifactState(changeDir) {
  const files = listFiles(changeDir).filter((path) => !relative(changeDir, path).replaceAll('\\', '/').startsWith('.powersnexus/'));
  const hash = createHash('sha256');
  let updatedAt = 0;
  for (const path of files) {
    const relativePath = relative(changeDir, path).replaceAll('\\', '/');
    const content = readFileSync(path);
    hash.update(`${relativePath}\0${sha256(content)}\n`);
    updatedAt = Math.max(updatedAt, statSync(path).mtimeMs);
  }
  const digest = hash.digest('hex');
  return {
    digest,
    revision: Number.parseInt(digest.slice(0, 12), 16),
    updatedAt: new Date(updatedAt || statSync(changeDir).mtimeMs).toISOString(),
  };
}

function collectRequirements(changeDir) {
  const deltaRoot = join(changeDir, 'delta-specs');
  if (!existsSync(deltaRoot)) return [];
  const requirements = [];
  for (const module of readdirSync(deltaRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
    const content = readText(join(deltaRoot, module.name, 'spec.md')) || '';
    for (const id of new Set(content.match(/REQ-\d+/g) || [])) requirements.push({ id, module: module.name });
  }
  return requirements.sort((left, right) => left.id.localeCompare(right.id, 'en'));
}

function collectTasks(changeDir) {
  const content = readText(join(changeDir, 'tasks.md')) || '';
  return content.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*- \[([ xX])]\s+(.+?)\s*$/);
    if (!match) return [];
    const explicitID = match[2].match(/^\[([A-Za-z0-9._-]+)]\s+(.+)$/);
    const title = explicitID ? explicitID[2] : match[2];
    return [{
      id: explicitID ? explicitID[1] : `task-${sha256(title.trim()).slice(0, 12)}`,
      title,
      status: match[1].toLowerCase() === 'x' ? 'completed' : 'pending',
    }];
  });
}

function deliveryState(changeDir) {
  const path = join(changeDir, 'delivery.json');
  if (!existsSync(path)) return null;
  try {
    const evidence = readJson(path);
    return {
      profile: evidence.profile || null,
      configured: Array.isArray(evidence.steps) && evidence.steps.length > 0 && evidence.steps.every((step) => Array.isArray(step.argv)),
      verified: typeof evidence.verifiedAt === 'string' && evidence.steps?.every((step) => step.status === 'passed' && step.exitCode === 0),
      verifiedAt: evidence.verifiedAt || null,
      fingerprint: evidence.deliveryFingerprint?.digest || null,
    };
  } catch (error) {
    return { configured: false, verified: false, error: error.message };
  }
}

function determinePhase(changeDir, tasks, delivery) {
  if (!existsSync(join(changeDir, 'proposal.md'))) return 'needs_proposal';
  if (collectRequirements(changeDir).length === 0) return 'needs_spec';
  if (!existsSync(join(changeDir, 'design.md'))) return 'needs_design';
  if (!existsSync(join(changeDir, 'tasks.md'))) return 'needs_plan';
  if (tasks.some((task) => task.status !== 'completed')) return 'implementing';
  if (!existsSync(join(changeDir, 'traceability.md'))) return 'needs_traceability';
  if (!delivery?.configured) return 'needs_delivery_config';
  if (!delivery.verified) return 'ready_to_verify';
  return 'ready_to_archive';
}

function createBlockers(phase, delivery) {
  if (delivery?.error) {
    return [{
      code: 'ARTIFACT_INVALID',
      message: `delivery.json 无法读取：${delivery.error}`,
      recoverable: true,
      evidence: ['delivery.json'],
      recoveryActions: ['configure_delivery'],
    }];
  }
  if (phase === 'needs_delivery_config') {
    return [{
      code: 'DELIVERY_COMMAND_UNCONFIRMED',
      message: '尚未配置并确认交付命令。',
      recoverable: true,
      evidence: ['delivery.json'],
      recoveryActions: ['configure_delivery'],
    }];
  }
  return [];
}

export function inspectChange({ projectRoot, changeName, powersnexusVersion }) {
  normalizeChangeName(changeName);
  const changeDir = resolve(projectRoot, '.novaway', 'powersnexus', 'changes', changeName);
  if (!existsSync(changeDir)) {
    throw bridgeError('CHANGE_NOT_FOUND', `变更不存在：${changeName}`, BRIDGE_EXIT.NOT_FOUND);
  }
  const artifact = collectArtifactState(changeDir);
  const requirements = collectRequirements(changeDir);
  const tasks = collectTasks(changeDir);
  const delivery = deliveryState(changeDir);
  const phase = determinePhase(changeDir, tasks, delivery);
  const blockers = createBlockers(phase, delivery);
  return {
    protocolVersion: PROTOCOL_VERSION,
    powersnexusVersion,
    changeName,
    level: null,
    phase,
    status: blockers.length > 0 ? 'blocked' : phase === 'completed' ? 'completed' : phase === 'implementing' ? 'running' : 'ready',
    revision: artifact.revision,
    artifactDigest: artifact.digest,
    requirements,
    tasks,
    blockers,
    nextAction: PHASE_ACTIONS[phase],
    delivery,
    updatedAt: artifact.updatedAt,
  };
}

export function validateChange(options) {
  const snapshot = inspectChange(options);
  const errors = snapshot.blockers.map((blocker) => ({ code: blocker.code, message: blocker.message, evidence: blocker.evidence || [] }));
  return { valid: errors.length === 0, errors, snapshot };
}

function validateRequest(request) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw bridgeError('INVALID_REQUEST', 'Action 请求必须是 JSON 对象。', BRIDGE_EXIT.INVALID_REQUEST);
  }
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(request.actionID || '')) {
    throw bridgeError('INVALID_REQUEST', 'actionID 必须是 8-128 位稳定标识。', BRIDGE_EXIT.INVALID_REQUEST);
  }
  if (!Number.isSafeInteger(request.expectedRevision) || request.expectedRevision < 0) {
    throw bridgeError('INVALID_REQUEST', 'expectedRevision 必须是非负安全整数。', BRIDGE_EXIT.INVALID_REQUEST);
  }
}

function configureDelivery(changeDir, input, profilesRoot) {
  const profileID = input?.profile;
  const profilePath = join(profilesRoot, `${profileID}.json`);
  if (!/^[a-z][a-z0-9-]{0,63}$/.test(profileID || '') || !existsSync(profilePath)) {
    throw bridgeError('ARTIFACT_INVALID', `未知交付 Profile：${profileID || '未提供'}`, BRIDGE_EXIT.INVALID_REQUEST);
  }
  const profile = readJson(profilePath);
  const steps = input?.steps;
  if (!Array.isArray(steps)) throw bridgeError('ARTIFACT_INVALID', 'input.steps 必须是数组。', BRIDGE_EXIT.INVALID_REQUEST);
  const byID = new Map(steps.map((step) => [step?.id, step]));
  const normalized = profile.requiredSteps.map((id) => {
    const step = byID.get(id);
    if (!step || !Array.isArray(step.argv) || (step.argv.length === 0 && !profile.runnerOwnedSteps.includes(id))) {
      throw bridgeError('DELIVERY_COMMAND_UNCONFIRMED', `${id} 缺少已确认 argv。`, BRIDGE_EXIT.INVALID_REQUEST);
    }
    if (!step.argv.every((argument) => typeof argument === 'string' && argument.length > 0)) {
      throw bridgeError('ARTIFACT_INVALID', `${id}.argv 必须是非空字符串数组。`, BRIDGE_EXIT.INVALID_REQUEST);
    }
    return { id, argv: step.argv, cwd: step.cwd || '.', timeoutMs: step.timeoutMs || 600000, status: 'pending' };
  });
  atomicWriteJson(join(changeDir, 'delivery.json'), { schemaVersion: '1', profile: profileID, steps: normalized });
}

function recordVerification(changeDir, input) {
  const deliveryPath = join(changeDir, 'delivery.json');
  if (!existsSync(deliveryPath)) throw bridgeError('ARTIFACT_INVALID', '缺少 delivery.json。', BRIDGE_EXIT.INVALID_REQUEST);
  const delivery = readJson(deliveryPath);
  if (!Array.isArray(input?.steps)) throw bridgeError('ARTIFACT_INVALID', 'verify 输入缺少 steps。', BRIDGE_EXIT.INVALID_REQUEST);
  const results = new Map(input.steps.map((step) => [step?.id, step]));
  delivery.steps = delivery.steps.map((step) => {
    const result = results.get(step.id);
    if (!result || !['passed', 'failed', 'cancelled'].includes(result.status) || !Number.isInteger(result.exitCode)) {
      throw bridgeError('ARTIFACT_INVALID', `${step.id} 缺少有效 Runner 结果。`, BRIDGE_EXIT.INVALID_REQUEST);
    }
    return { ...step, status: result.status, exitCode: result.exitCode, executedAt: result.executedAt || new Date().toISOString(), evidence: result.evidence || [] };
  });
  if (delivery.steps.some((step) => step.status !== 'passed' || step.exitCode !== 0)) {
    atomicWriteJson(deliveryPath, delivery);
    throw bridgeError('STEP_FAILED', '至少一个交付步骤未通过。', BRIDGE_EXIT.CONFLICT);
  }
  delivery.verifiedAt = input.verifiedAt || new Date().toISOString();
  delivery.deliveryFingerprint = input.deliveryFingerprint;
  if (!delivery.deliveryFingerprint || !/^[a-f0-9]{64}$/.test(delivery.deliveryFingerprint.digest || '')) {
    throw bridgeError('ARTIFACT_INVALID', 'verify 输入缺少有效 deliveryFingerprint。', BRIDGE_EXIT.INVALID_REQUEST);
  }
  atomicWriteJson(deliveryPath, delivery);
}

export function transitionChange({ projectRoot, changeName, powersnexusVersion, profilesRoot, request }) {
  validateRequest(request);
  const changeDir = resolve(projectRoot, '.novaway', 'powersnexus', 'changes', changeName);
  const actionStorePath = join(changeDir, '.powersnexus', 'bridge-actions.json');
  const store = existsSync(actionStorePath) ? readJson(actionStorePath) : {};
  const requestDigest = sha256(JSON.stringify(request));
  if (store[request.actionID]) {
    if (store[request.actionID].requestDigest !== requestDigest) {
      throw bridgeError('REVISION_CONFLICT', '相同 actionID 对应了不同请求。', BRIDGE_EXIT.CONFLICT);
    }
    return { actionID: request.actionID, accepted: true, replayed: true, snapshot: inspectChange({ projectRoot, changeName, powersnexusVersion }) };
  }
  const before = inspectChange({ projectRoot, changeName, powersnexusVersion });
  if (request.expectedRevision !== before.revision) {
    throw bridgeError('REVISION_CONFLICT', `revision 已变化：期望 ${request.expectedRevision}，实际 ${before.revision}`, BRIDGE_EXIT.CONFLICT);
  }

  if (request.action === 'configure_delivery') configureDelivery(changeDir, request.input, profilesRoot);
  else if (request.action === 'verify') recordVerification(changeDir, request.input);
  else {
    throw bridgeError('INVALID_TRANSITION', `Bridge 不执行 ${request.action || '未提供'}；该动作由 NovaWay Workflow Service 或 Agent Runtime 协调。`, BRIDGE_EXIT.CONFLICT);
  }

  store[request.actionID] = { requestDigest, completedAt: new Date().toISOString() };
  atomicWriteJson(actionStorePath, store);
  return { actionID: request.actionID, accepted: true, replayed: false, snapshot: inspectChange({ projectRoot, changeName, powersnexusVersion }) };
}

export function serializeBridgeError(error) {
  return {
    protocolVersion: PROTOCOL_VERSION,
    error: {
      code: error.code || 'INTERNAL_WORKFLOW_ERROR',
      message: error.code ? error.message : 'PowersNexus Bridge 内部错误。',
      recoverable: Boolean(error.code),
      evidence: error.evidence || [],
    },
  };
}
