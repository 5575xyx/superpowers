import { LanguageAdapter, Rule } from '../types';
import { allRules } from '../rules';

export class BaseAdapter implements LanguageAdapter {
  name: string;
  extensions: string[];

  constructor(name: string, extensions: string[]) {
    this.name = name;
    this.extensions = extensions;
  }

  detect(filePath: string): boolean {
    const ext = filePath.split('.').pop()?.toLowerCase();
    return this.extensions.includes(ext || '');
  }

  getRules(): Rule[] {
    return allRules;
  }
}

export class JavaScriptAdapter extends BaseAdapter {
  constructor() {
    super('javascript', ['js', 'jsx', 'ts', 'tsx']);
  }
}

export class PythonAdapter extends BaseAdapter {
  constructor() {
    super('python', ['py']);
  }
}

export class GoAdapter extends BaseAdapter {
  constructor() {
    super('go', ['go']);
  }
}

export class JavaAdapter extends BaseAdapter {
  constructor() {
    super('java', ['java']);
  }
}

export class RustAdapter extends BaseAdapter {
  constructor() {
    super('rust', ['rs']);
  }
}

export const adapters: LanguageAdapter[] = [
  new JavaScriptAdapter(),
  new PythonAdapter(),
  new GoAdapter(),
  new JavaAdapter(),
  new RustAdapter(),
];

export function getAdapterForFile(filePath: string): LanguageAdapter | null {
  return adapters.find((a) => a.detect(filePath)) || null;
}