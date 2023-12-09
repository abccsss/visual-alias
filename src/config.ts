export interface PatternGroup {
  language: string | string[];
  defaultPrefix?: string;
  defaultSuffix?: string;
  defaultStyle?: StyleEntry;
  patterns: (string | PatternEntry)[];
}

export interface PatternEntry extends StyleEntry {
  pattern: string;
  replacement: string;
  useDefaultPrefixAndSuffix?: boolean;
  useDefaultStyle?: boolean;
}

export interface StyleEntry extends SimpleStyleEntry {
  dark?: SimpleStyleEntry;
  light?: SimpleStyleEntry;
}

export interface SimpleStyleEntry {
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
