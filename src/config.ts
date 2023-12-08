export interface LanguageEntry {
  language: string | string[];
  patterns: (string | PatternEntry)[];
}

export interface PatternEntry {
  pattern: string;
  replacement: string;
  backgroundColor?: string;
  border?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontStyle?: string;
  fontWeight?: string;
  textDecoration?: string;
  css?: string;
}
