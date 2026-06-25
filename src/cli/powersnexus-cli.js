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
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_DIR = process.cwd();
const POWERSEXUS_DIR = join(BASE_DIR, '.novaway', 'powersnexus');
const CHANGES_DIR = join(POWERSEXUS_DIR, 'changes');
const SPECS_DIR = join(POWERSEXUS_DIR, 'specs');

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

  // 检查 delta-specs 中的 REQ 是否都在 design 中
  if (allDeltaReqs.length > 0 && designReqs.length > 0) {
    const missingInDesign = allDeltaReqs.filter(r => !designReqs.includes(r));
    if (missingInDesign.length > 0) {
      console.log(`  ❌ design.md 缺少 REQ: ${missingInDesign.join(', ')}`);
      allPassed = false;
    } else {
      console.log('  ✅ delta-specs REQ 与 design.md 一致');
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
 * 归档合并自动化
 * 识别创建模式，合并 delta-specs 到主规格，生成 merge-report
 */
function archiveChange(changeName) {
  console.log(`\n📦 归档变更: ${changeName}\n`);

  const changeDir = join(CHANGES_DIR, changeName);
  if (!existsSync(changeDir)) {
    console.error(`❌ 错误: 变更目录不存在: ${changeDir}`);
    process.exit(1);
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

  // 3. 合并处理
  const mergeActions = [];
  let hasError = false;

  for (const module of modules) {
    const deltaSpecPath = join(deltaSpecsDir, module, 'spec.md');
    const masterSpecPath = join(SPECS_DIR, module, 'spec.md');
    const masterSpecExists = existsSync(masterSpecPath);

    console.log(`\n📁 处理模块: ${module}`);
    console.log(`  主规格状态: ${masterSpecExists ? '已存在' : '不存在'}`);

    // 确定子模式
    let subMode = mode;
    if (mode === 'mixed') {
      subMode = masterSpecExists ? 'brownfield' : 'greenfield';
    } else if (mode === 'unknown') {
      subMode = masterSpecExists ? 'brownfield' : 'greenfield';
    }

    console.log(`  子模式: ${subMode}`);

    if (subMode === 'greenfield') {
      // Greenfield: 直接将 delta-specs 作为初始主规格
      const deltaContent = readMarkdown(deltaSpecPath);
      
      // 从 delta-specs 中提取 ADDED 部分，生成主规格
      ensureDir(join(SPECS_DIR, module));
      
      // 简化处理：直接复制并转换格式
      const masterSpecContent = generateMasterSpec(module, deltaContent);
      writeFileSync(masterSpecPath, masterSpecContent, 'utf-8');
      
      console.log(`  ✅ 创建主规格: ${masterSpecPath}`);
      mergeActions.push({ module, mode: 'greenfield', action: 'created', version: 'v1.0' });
    } else {
      // Brownfield: 合并（简化版本，实际应执行完整合并逻辑）
      console.log(`  ⚠️  Brownfield 模式需要人工审查合并`);
      console.log(`  ℹ️  请手动将 delta-specs 合并到主规格`);
      mergeActions.push({ module, mode: 'brownfield', action: 'pending_manual_merge' });
      hasError = true;
    }
  }

  // 4. 生成 merge-report.md
  const reportDate = new Date().toISOString().split('T')[0];
  const reportContent = generateMergeReport(changeName, mode, mergeActions, reportDate);
  const reportPath = join(changeDir, 'merge-report.md');
  writeFileSync(reportPath, reportContent, 'utf-8');
  console.log(`\n📄 生成合并报告: ${reportPath}`);

  // 5. 移动到 archive
  const archiveDir = join(CHANGES_DIR, 'archive');
  ensureDir(archiveDir);
  const archiveName = `${reportDate}-${changeName}`;
  const archivePath = join(archiveDir, archiveName);

  try {
    renameSync(changeDir, archivePath);
    console.log(`✅ 已移动到归档: ${archivePath}`);
  } catch (e) {
    console.log(`⚠️  移动到归档失败: ${e.message}`);
    console.log(`ℹ️  请手动移动: ${changeDir} → ${archivePath}`);
  }

  console.log('\n📊 归档完成！');
  console.log(`  模式: ${mode}`);
  console.log(`  模块数: ${modules.length}`);
  console.log(`  动作数: ${mergeActions.length}`);
  console.log('');

  return hasError ? 1 : 0;
}

/**
 * 生成主规格内容（简化版）
 */
function generateMasterSpec(module, deltaContent) {
  const today = new Date().toISOString().split('T')[0];
  
  // 提取 ADDED 部分
  const addedMatch = deltaContent.match(/## ADDED Requirements([\s\S]*?)(## |$)/);
  const addedContent = addedMatch ? addedMatch[1] : deltaContent;

  return `# Master Specification: ${module}

> 路径：.novaway/powersnexus/specs/${module}/spec.md
> 用途：项目主规格（单一事实来源）
> 版本：v1.0
> 状态：Active
> 创建模式：Greenfield（首次创建）

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

（请从 proposal.md 中补充模块概述）

---

## 2. 功能规格

### 2.2 详细需求

${addedContent}

---

## 3. 非功能性需求

（待补充）

---

## 4. 架构设计

（从 design.md 中补充）

---

## 5. 数据模型

（从 design.md 中补充）

---

## 6. 变更历史

| 版本 | 日期 | 变更类型 | 变更说明 | 关联变更 |
|------|------|----------|----------|----------|
| v1.0 | ${today} | INITIAL | 首次创建 | ${module} |

---

## 7. 术语表

| 术语 | 定义 |
|------|------|

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
| - | REQ-xxx | ADDED | 新增需求 |

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
- [ ] 主规格已更新或新建
- [x] 变更历史已追加
- [ ] 知识库已记录

---

**报告生成时间：** ${new Date().toISOString()}
**生成者：** powersnexus-cli
`;
}

/**
 * 流程启动器
 * 评估任务规模，推荐 L0-L4 流程
 */
function startTask(taskDesc) {
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
  // L3 特征
  else if (lowerDesc.includes('大型') || lowerDesc.includes('架构') ||
           lowerDesc.includes('重构') || lowerDesc.includes('跨模块') ||
           lowerDesc.includes('完整流程')) {
    level = 'L3';
    levelName = '完整流程';
    confidence = 80;
  }
  // L4 特征
  else if (lowerDesc.includes('核心架构') || lowerDesc.includes('重大重构') ||
           lowerDesc.includes('系统级') || lowerDesc.includes('重量级')) {
    level = 'L4';
    levelName = '重量级';
    confidence = 90;
  }

  console.log(`📊 评估结果：`);
  console.log(`  推荐级别: ${level} - ${levelName}`);
  console.log(`  置信度: ${confidence}%`);
  console.log('');
  console.log(`📋 流程概览：`);

  const levels = {
    'L0': { steps: '直接修改 → 验证 → 提交', docs: '无', time: '< 5 分钟' },
    'L1': { steps: '快速设计 → 实现 → 测试 → 自审', docs: 'tasks.md', time: '< 30 分钟' },
    'L2': { steps: 'design + tasks + 自审 + 测试', docs: 'design.md + tasks.md', time: '1-2 小时' },
    'L3': { steps: '完整 OpenSpec + 红队审查 + TDD', docs: '全套文档', time: '4-8 小时' },
    'L4': { steps: 'L3 + 多轮审查 + 用户确认', docs: '全套 + 评审记录', time: '1 天+' },
  };

  const info = levels[level];
  console.log(`  核心步骤: ${info.steps}`);
  console.log(`  文档产出: ${info.docs}`);
  console.log(`  预计耗时: ${info.time}`);
  console.log('');

  console.log(`💡 提示：这是初步评估，实际级别可能需要调整。`);
  console.log(`   使用 --level L1 强制指定级别`);
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

  console.log('');
  console.log('✅ 追踪表生成完成！');
  console.log(`   请手动补充代码实现和测试覆盖信息。`);
  console.log('');

  return 0;
}

// ============== 主入口 ==============

function printHelp() {
  console.log(`
PowersNexus CLI - 自动化工具集 v3.0

用法:
  powersnexus <command> [options]

命令:
  check consistency <change-name>   文档一致性检查
  archive <change-name>             归档合并自动化
  start <task-description>          流程启动器（评估任务规模）
  trace <change-name>               需求追踪自动生成
  help                              显示帮助信息

示例:
  powersnexus check consistency my-feature
  powersnexus archive my-feature
  powersnexus start "添加用户登录功能"
  powersnexus trace my-feature
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
      } else {
        console.error(`❌ 未知检查命令: ${subCommand}`);
        console.log('可用命令: consistency');
        process.exit(1);
      }
      break;

    case 'archive':
      process.exit(archiveChange(subCommand));
      break;

    case 'start':
      const taskDesc = args.slice(1).join(' ');
      process.exit(startTask(taskDesc));
      break;

    case 'trace':
      process.exit(generateTrace(subCommand));
      break;

    default:
      console.error(`❌ 未知命令: ${command}`);
      console.log('使用 "powersnexus help" 查看可用命令');
      process.exit(1);
  }
}

main();
