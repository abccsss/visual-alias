import * as vscode from 'vscode';
import { debounce } from 'ts-debounce';

import { LanguageEntry } from './config';

/** Represents a single document that is being processed by the Visual Alias extension. */
export class AliasDocument extends vscode.Disposable {
  private document: vscode.TextDocument;
  private editors: vscode.TextEditor[];

  private config: vscode.WorkspaceConfiguration;
  private patterns: Pattern[] = [];
  private maxLineCount: number = 10000;
  private maxLineLength: number = 1000;

  private version: number = -1;
  private decorations: Map<Pattern, vscode.TextEditorDecorationType> =
    new Map();
  private replacements: Replacement[] = [];
  private revealedReplacements: Map<vscode.TextEditor, Replacement[]> =
    new Map();
  private hideDecoration: vscode.TextEditorDecorationType;

  debouncedUpdate = debounce(() => {
    setTimeout(() => {
      this.update();
    }, 0);
  }, 100);

  /** Creates a new `AliasDocument` instance.
   *
   * @param document The `vscode.TextDocument` to process.
   * @param config The VS Code configuration.
   * @param editors The `vscode.TextEditor` objects associated with the document.
   */
  constructor(
    document: vscode.TextDocument,
    config: vscode.WorkspaceConfiguration,
    editors: vscode.TextEditor[] = []
  ) {
    super(() => this.dispose());

    this.config = config;
    this.document = document;
    this.editors = editors;
    this.hideDecoration = this.getHideDecoration();

    this.forceReload();
  }

  /** Updates the configuration associated with this document.
   *
   * @param config The updated configuration.
   */
  setConfig(config: vscode.WorkspaceConfiguration) {
    if (config !== this.config) {
      this.config = config;
      this.forceReload();
    }
  }

  /** Updates the `vscode.TextEditor` objects associated with this document.
   *
   * @param editors The updated `vscode.TextEditor` objects.
   */
  setEditors(editors: vscode.TextEditor[]) {
    if (!arrayEquals(editors, this.editors)) {
      this.editors = editors;

      this.revealedReplacements = new Map();
      for (const editor of this.editors) {
        this.revealedReplacements.set(editor, []);
      }

      this.forceReload();
    }
  }

  /** Updates the replacements,
   * e.g. after the content of the document has changed,
   * or after the caret has moved.
   */
  update() {
    if (this.editors.length === 0) {
      return;
    }

    const contentHasChanged = this.document.version > this.version;

    if (contentHasChanged) {
      this.version = this.document.version;
      this.replacements = this.calculateReplacements();
    }

    const revealedReplacements = this.calculateRevealedReplacements();

    // Check if revealed replacements have changed
    if (
      !contentHasChanged &&
      this.editors.every((editor) =>
        arrayEquals(
          revealedReplacements.get(editor) || [],
          this.revealedReplacements.get(editor) || []
        )
      )
    ) {
      return;
    }

    this.revealedReplacements = revealedReplacements;
    this.applyDecorations();
  }

  dispose() {
    this.hideDecoration.dispose();

    for (const decoration of this.decorations.values()) {
      decoration.dispose();
    }
  }

  private forceReload() {
    this.replacements = [];
    this.version = -1;

    this.rebuildConfig();
    this.update();
  }

  private rebuildConfig() {
    const languageId = this.document.languageId;

    this.patterns = [];

    for (const decoration of this.decorations.values()) {
      decoration.dispose();
    }
    this.decorations.clear();

    this.config
      .get<LanguageEntry[]>('patterns', [])
      .forEach((entry: LanguageEntry) => {
        if (typeof entry.language === 'string') {
          if (entry.language !== '*' && entry.language !== languageId) {
            return;
          }
        } else if (!entry.language.includes(languageId)) {
          return;
        }

        entry.patterns.forEach((pattern) => {
          if (typeof pattern === 'string') {
            // find '/' not preceded by an odd number of '\'s
            const regex = /(?<!\\)(?:\\\\)*\//;
            const match = regex.exec(pattern);
            if (!match) {
              return;
            }

            const find = pattern.slice(0, match.index + match[0].length - 1);
            const replacement = pattern.slice(match.index + match[0].length);

            try {
              const builtPattern: Pattern = {
                pattern: new RegExp(find, 'g'),
                replacement,
              };
              this.patterns.push(builtPattern);
              this.decorations.set(
                builtPattern,
                this.getReplacementDecoration(builtPattern)
              );
            } catch {}
          } else {
            try {
              const builtPattern: Pattern = {
                ...pattern,
                pattern: new RegExp(pattern.pattern, 'g'),
              };
              this.patterns.push(builtPattern);
              this.decorations.set(
                builtPattern,
                this.getReplacementDecoration(builtPattern)
              );
            } catch {}
          }
        });
      });

    this.maxLineCount =
      this.config.get<number>('maxLineCount', 10000) || Infinity;
    this.maxLineLength =
      this.config.get<number>('maxLineLength', 1000) || Infinity;
  }

  private calculateReplacements(): Replacement[] {
    const replacements: Replacement[] = [];
    const lineCount = this.document.lineCount;
    if (lineCount > this.maxLineCount) {
      return replacements;
    }

    for (let i = 0; i < lineCount; i++) {
      const line = this.document.lineAt(i);
      replacements.push(...this.calculateLineReplacements(line));
    }

    return replacements;
  }

  private calculateLineReplacements(line: vscode.TextLine): Replacement[] {
    const text = line.text;
    const lineReplacements: Replacement[] = [];

    if (text.length > this.maxLineLength) {
      return [];
    }

    for (const pattern of this.patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.pattern.exec(text))) {
        if (match[0].length === 0) {
          continue;
        }

        const range = new vscode.Range(
          line.lineNumber,
          match.index,
          line.lineNumber,
          match.index + match[0].length
        );

        lineReplacements.push({
          range,
          pattern,
        });
      }
    }

    // Sort lineReplacements by range start, then by length descending
    lineReplacements.sort((a, b) => {
      const startDiff = a.range.start.compareTo(b.range.start);
      if (startDiff !== 0) {
        return startDiff;
      }

      return -a.range.end.compareTo(b.range.end);
    });

    // Remove overlaps
    for (let i = 0; i < lineReplacements.length - 1; i++) {
      const a = lineReplacements[i];
      const b = lineReplacements[i + 1];

      if (a.range.end.isAfter(b.range.start)) {
        lineReplacements.splice(i + 1, 1);
        i--;
      }
    }

    return lineReplacements;
  }

  private calculateRevealedReplacements(): Map<
    vscode.TextEditor,
    Replacement[]
  > {
    const map = new Map();

    for (const editor of this.editors) {
      const selections = editor.selections;
      const revealedReplacements = this.replacements.filter((replacement) => {
        for (const selection of selections) {
          if (replacement.range.intersection(selection)) {
            return true;
          }
        }
        return false;
      });

      map.set(editor, revealedReplacements);
    }

    return map;
  }

  private applyDecorations() {
    for (const editor of this.editors) {
      const revealedReplacements = this.revealedReplacements.get(editor) || [];

      const effectiveReplacements = this.replacements.filter(
        (replacement) => !revealedReplacements.includes(replacement)
      );

      editor.setDecorations(
        this.hideDecoration,
        effectiveReplacements.map((replacement) => replacement.range)
      );

      for (const pattern of this.patterns) {
        const decoration = this.decorations.get(pattern);
        if (!decoration) {
          continue;
        }

        const replacements = effectiveReplacements.filter(
          (replacement) => replacement.pattern === pattern
        );

        editor.setDecorations(
          decoration,
          replacements.map((replacement) => replacement.range)
        );
      }
    }
  }

  private getHideDecoration() {
    // A decoration that hides text.
    // This is hacky and uses CSS injection.
    return vscode.window.createTextEditorDecorationType({
      textDecoration: 'none; font-size: 0',
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    });
  }

  private getReplacementDecoration(pattern: Pattern) {
    let injectedCss = '';
    if (pattern.fontFamily) {
      injectedCss += `; font-family: ${pattern.fontFamily}`;
    }
    if (pattern.fontSize) {
      injectedCss += `; font-size: ${pattern.fontSize}`;
    }
    if (pattern.css) {
      injectedCss += `; ${pattern.css}`;
    }

    // Injecting to `color` as it seems to override everything else
    return vscode.window.createTextEditorDecorationType({
      before: {
        contentText: pattern.replacement,
        backgroundColor: pattern.backgroundColor,
        border: pattern.border,
        color: (pattern.color || '') + injectedCss,
        fontStyle: pattern.fontStyle,
        fontWeight: pattern.fontWeight,
        textDecoration: pattern.textDecoration,
      },
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    });
  }
}

function arrayEquals<T>(a: T[], b: T[]) {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    const aItem = a[i];
    const bItem = b[i];

    if (aItem !== bItem) {
      return false;
    }
  }

  return true;
}

interface Pattern {
  pattern: RegExp;
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

interface Replacement {
  range: vscode.Range;
  pattern: Pattern;
}
