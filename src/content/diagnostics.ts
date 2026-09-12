export type DiagnosticLevel = 'error' | 'warning';

export interface ContentDiagnostic {
  level: DiagnosticLevel;
  code: string;
  message: string;
  path?: string;
  id?: string;
}

export function hasErrors(diagnostics: ContentDiagnostic[]): boolean {
  return diagnostics.some(item => item.level === 'error');
}
