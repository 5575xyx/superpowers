import { Issue, Rule } from '../types';

export const indentationRule: Rule = {
  name: 'indentation',
  description: '检查代码缩进',
  check(content: string, fileName: string): Issue[] {
    const issues: Issue[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^( +|\t+)/);
      if (match) {
        const indent = match[0];
        if (indent.includes(' ') && indent.includes('\t')) {
          issues.push({
            file: fileName,
            line: i + 1,
            column: indent.length,
            rule: 'indentation',
            severity: 'error',
            message: '混合缩进（空格和制表符）',
            suggestion: '统一使用空格或制表符',
          });
        }
      }
    }

    return issues;
  },
};

export const trailingSpaceRule: Rule = {
  name: 'trailing-space',
  description: '检查行尾空格',
  check(content: string, fileName: string): Issue[] {
    const issues: Issue[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/\s+$/.test(lines[i])) {
        const match = lines[i].match(/\s+$/);
        issues.push({
          file: fileName,
          line: i + 1,
          column: lines[i].length - (match?.[0].length ?? 0) + 1,
          rule: 'trailing-space',
          severity: 'warning',
          message: '行尾有多余空格',
          suggestion: '删除行尾空格',
        });
      }
    }

    return issues;
  },
};

export const emptyLinesRule: Rule = {
  name: 'empty-lines',
  description: '检查空行数量',
  check(content: string, fileName: string): Issue[] {
    const issues: Issue[] = [];
    const lines = content.split('\n');

    let consecutiveEmpty = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '') {
        consecutiveEmpty++;
        if (consecutiveEmpty > 2) {
          issues.push({
            file: fileName,
            line: i + 1,
            column: 1,
            rule: 'empty-lines',
            severity: 'warning',
            message: '连续空行超过2个',
            suggestion: '最多保留2个连续空行',
          });
        }
      } else {
        consecutiveEmpty = 0;
      }
    }

    if (lines.length > 0 && lines[0].trim() === '') {
      issues.push({
        file: fileName,
        line: 1,
        column: 1,
        rule: 'empty-lines',
        severity: 'info',
        message: '文件开头有空行',
        suggestion: '删除文件开头的空行',
      });
    }

    return issues;
  },
};

export const lineLengthRule: Rule = {
  name: 'line-length',
  description: '检查行长度',
  check(content: string, fileName: string): Issue[] {
    const issues: Issue[] = [];
    const lines = content.split('\n');
    const maxLength = 120;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > maxLength) {
        issues.push({
          file: fileName,
          line: i + 1,
          column: maxLength + 1,
          rule: 'line-length',
          severity: 'warning',
          message: `行长度超过${maxLength}字符`,
          suggestion: '拆分过长的行',
        });
      }
    }

    return issues;
  },
};

export const namingRule: Rule = {
  name: 'naming',
  description: '检查命名风格',
  check(content: string, fileName: string): Issue[] {
    const issues: Issue[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const varMatches = line.match(/(?:const|let|var)\s+(\w+)/g);
      if (varMatches) {
        for (const match of varMatches) {
          const varName = match.match(/(?:const|let|var)\s+(\w+)/)?.[1];
          if (varName && /^[A-Z]/.test(varName) && !/^[A-Z][a-z]+(?:[A-Z][a-z]+)*$/.test(varName)) {
            issues.push({
              file: fileName,
              line: i + 1,
              column: line.indexOf(varName) + 1,
              rule: 'naming',
              severity: 'warning',
              message: `变量名 ${varName} 应为驼峰命名（camelCase）`,
              suggestion: '改为小写开头的驼峰命名',
            });
          }
        }
      }

      const funcMatches = line.match(/function\s+(\w+)/g);
      if (funcMatches) {
        for (const match of funcMatches) {
          const funcName = match.match(/function\s+(\w+)/)?.[1];
          if (funcName && /^[A-Z]/.test(funcName)) {
            issues.push({
              file: fileName,
              line: i + 1,
              column: line.indexOf(funcName) + 1,
              rule: 'naming',
              severity: 'warning',
              message: `函数名 ${funcName} 应为驼峰命名（camelCase）`,
              suggestion: '改为小写开头的驼峰命名',
            });
          }
        }
      }
    }

    return issues;
  },
};

export const encodingRule: Rule = {
  name: 'encoding',
  description: '检查文件编码',
  check(content: string, fileName: string): Issue[] {
    const issues: Issue[] = [];

    if (content.charCodeAt(0) === 0xFEFF) {
      issues.push({
        file: fileName,
        line: 1,
        column: 1,
        rule: 'encoding',
        severity: 'error',
        message: '文件包含 BOM 标记',
        suggestion: '使用无 BOM 的 UTF-8 编码',
      });
    }

    return issues;
  },
};

export const eofNewlineRule: Rule = {
  name: 'eof-newline',
  description: '检查文件末尾换行',
  check(content: string, fileName: string): Issue[] {
    const issues: Issue[] = [];

    if (content.length > 0 && !content.endsWith('\n')) {
      issues.push({
        file: fileName,
        line: content.split('\n').length,
        column: content.length,
        rule: 'eof-newline',
        severity: 'warning',
        message: '文件末尾缺少换行符',
        suggestion: '在文件末尾添加换行符',
      });
    }

    if (content.endsWith('\n\n')) {
      issues.push({
        file: fileName,
        line: content.split('\n').length,
        column: 1,
        rule: 'eof-newline',
        severity: 'info',
        message: '文件末尾有多余换行',
        suggestion: '删除多余的末尾换行',
      });
    }

    return issues;
  },
};

export const commentsRule: Rule = {
  name: 'comments',
  description: '检查注释风格',
  check(content: string, fileName: string): Issue[] {
    const issues: Issue[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('//') && lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('///')) {
        if (lines[i].trim().length > 0 && !lines[i].trim().startsWith('// ')) {
          const commentStart = lines[i].indexOf('//');
          if (lines[i][commentStart + 2] !== ' ') {
            issues.push({
              file: fileName,
              line: i + 1,
              column: commentStart + 3,
              rule: 'comments',
              severity: 'info',
              message: '注释后缺少空格',
              suggestion: '在 // 后添加空格',
            });
          }
        }
      }
    }

    return issues;
  },
};

export const importsRule: Rule = {
  name: 'imports',
  description: '检查 import 排序',
  check(content: string, fileName: string): Issue[] {
    const issues: Issue[] = [];
    const lines = content.split('\n');
    const importLines: { line: number; text: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].startsWith('const ')) {
        const match = lines[i].match(/^(import|const)\s+[\w*]/);
        if (match) {
          importLines.push({ line: i + 1, text: lines[i] });
        }
      }
    }

    const sortedImports = [...importLines].sort((a, b) => a.text.localeCompare(b.text));
    for (let i = 0; i < importLines.length; i++) {
      if (importLines[i].text !== sortedImports[i].text) {
        issues.push({
          file: fileName,
          line: importLines[i].line,
          column: 1,
          rule: 'imports',
          severity: 'warning',
          message: 'import 语句未排序',
          suggestion: '按字母顺序排序 import 语句',
        });
        break;
      }
    }

    return issues;
  },
};

export const allRules: Rule[] = [
  indentationRule,
  trailingSpaceRule,
  emptyLinesRule,
  lineLengthRule,
  namingRule,
  encodingRule,
  eofNewlineRule,
  commentsRule,
  importsRule,
];