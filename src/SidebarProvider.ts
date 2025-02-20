import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import { TaskGenerator } from "./TaskGenerator";
import { FileHelper } from "./FileHelper";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  _fileHelper: FileHelper = new FileHelper();
  _taskGenerator: TaskGenerator = new TaskGenerator();

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public async resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Send file list to webview
    const files = await this.getWorkspaceFiles();
    webviewView.webview.postMessage({ type: "fileList", files });

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "submitTask":
          try {
            const allFiles = await this._fileHelper.getAllFilesInProject();

            const result = await this._taskGenerator.generatePlanForTask(
              data.task,
              data.selectedFiles,
              allFiles
            );

            webviewView.webview.postMessage({
              type: "plan",
              plan: result,
            });
          } catch (error) {
            console.error(error);
            vscode.window.showErrorMessage("Failed to generate plan");
            // Refresh the webview
            webviewView.webview.postMessage({
              type: "resetTask",
            });
          }

          break;
        case "requestFiles":
          const files = await this.getWorkspaceFiles();
          webviewView.webview.postMessage({ type: "fileList", files });
          break;
      }
    });
  }

  private async getWorkspaceFiles(): Promise<
    { relativePath: string; absolutePath: string }[]
  > {
    if (!vscode.workspace.workspaceFolders) return [];
    const files = await vscode.workspace.findFiles(
      "**/*.{js,ts,tsx,jsx,py,java,c,cpp,go}",
      "**/node_modules/**"
    );
    return files.map((file) => {
      return {
        relativePath: vscode.workspace.asRelativePath(file),
        absolutePath: file.fsPath,
      };
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.js")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.css")
    );

    const nonce = getNonce();
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
        </script>
      </head>
      <body>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}
