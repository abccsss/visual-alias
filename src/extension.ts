import * as vscode from 'vscode';

import { AliasDocument } from './document';

let config: vscode.WorkspaceConfiguration;
const documents: Map<vscode.Uri, AliasDocument> = new Map();

/** This function is called when the extension is activated. */
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument(onDidCloseDocument)
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(onDidChangeConfiguration)
  );
  context.subscriptions.push(
    vscode.window.onDidChangeVisibleTextEditors(reloadVisibleDocuments)
  );
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(onDidChangeTextEditorSelection)
  );

  reloadConfiguration();
}

/** This function is called when the extension is deactivated. */
export function deactivate() {
  for (const document of documents.values()) {
    document.dispose();
  }
  documents.clear();
}

function onDidCloseDocument(doc: vscode.TextDocument) {
  if (!documents.has(doc.uri)) {
    return;
  }

  const aliasDocument = documents.get(doc.uri);
  aliasDocument?.dispose();
  documents.delete(doc.uri);
}

function onDidChangeConfiguration(event: vscode.ConfigurationChangeEvent) {
  if (event.affectsConfiguration('visualAlias')) {
    reloadConfiguration();
  }
}

function onDidChangeTextEditorSelection(
  event: vscode.TextEditorSelectionChangeEvent
) {
  const document = documents.get(event.textEditor.document.uri);
  document?.debouncedUpdate();
}

function reloadVisibleDocuments() {
  const visibleEditors = vscode.window.visibleTextEditors;

  for (const editor of visibleEditors) {
    const isNewDocument = !documents.has(editor.document.uri);

    const document =
      documents.get(editor.document.uri) ??
      new AliasDocument(editor.document, config);
    document.setEditors(
      visibleEditors.filter((e) => e.document.uri === editor.document.uri)
    );

    if (isNewDocument) {
      documents.set(editor.document.uri, document);
    }
  }
}

function reloadConfiguration() {
  config = vscode.workspace.getConfiguration('visualAlias');
  for (const document of documents.values()) {
    document.setConfig(config);
  }

  reloadVisibleDocuments();
}
