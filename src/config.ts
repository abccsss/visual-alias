export interface LanguageEntry {
  language: string | string[];
  patterns: (string | PatternEntry)[];
}

export interface PatternEntry {
  pattern: string;
  replacement: string;
}
