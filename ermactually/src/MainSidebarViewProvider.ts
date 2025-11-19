import * as vscode from 'vscode';
import OpenAI from 'openai';

export class MainSidebarViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ermactually.mainSidebarView';

    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')]
        };

        webviewView.webview.html = this.getHtml(webviewView.webview);
        
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.type === "processCode") {
                const result = await this.processActiveFile();
                webviewView.webview.postMessage({type: 'processedResult', result});
            }
        });
    }

    private getHtml(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
        );

        const nonce = this.getNonce();

        return /* html */ `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src ${webview.cspSource};">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Erm View</title>
        </head>
        <body style="margin: 0; padding: 16px; font-family: var(--vscode-font-family); color: var(--vscode-foreground); background-color: var(--vscode-editor-background);">
            <!-- Commit Status Section -->
            <div style="margin-bottom: 20px;">
                <h2 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Commit Status:</h2>
                <div style="padding: 8px; background-color: var(--vscode-input-background); border-radius: 4px; font-size: 12px;">
                    <span style="color: var(--vscode-textLink-foreground);">✓ Ready to commit</span>
                </div>
            </div>

            <!-- Image Placeholder -->
            <div style="margin-bottom: 20px; text-align: center;">
                <div style="width: 100%; height: 150px; background-color: var(--vscode-input-background); border: 1px dashed var(--vscode-input-border); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: var(--vscode-descriptionForeground); font-size: 12px;">
                    Image Placeholder
                </div>
            </div>

            <!-- Vulnerabilities Section -->
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600;">Vulnerabilities</h3>
                <div style="padding: 12px; background-color: var(--vscode-input-background); border-radius: 4px; min-height: 60px;">
                    <p style="margin: 0; font-size: 12px; color: var(--vscode-descriptionForeground);">There is no current issues</p>
                </div>
            </div>

            <!-- Warnings Section -->
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600;">Warnings</h3>
                <div style="padding: 12px; background-color: var(--vscode-input-background); border-radius: 4px; min-height: 60px;">
                    <p style="margin: 0; font-size: 12px; color: var(--vscode-descriptionForeground);">There are no current warnings</p>
                </div>
            </div>

            <!-- Bottom Action Buttons -->
            <div style="display: flex; justify-content: space-between; margin-top: auto; padding-top: 16px; border-top: 1px solid var(--vscode-input-border);">
                <button id="runButton" style="flex: 1; margin-right: 8px; padding: 8px 16px; background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;">Run</button>
                <button id="settingsButton" style="padding: 8px 12px; background-color: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; border-radius: 4px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;">
                    ⚙️
                </button>
            </div>

            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
    }
    private getNonce() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    private async processActiveFile(): Promise<string> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return 'No active editor found.';
        }
    
        const document = editor.document;
        const code = document.getText();
    
        // Placeholder for actual code processing logic
        const processedCode = `Processed code length: ${code.length} characters.`;
    
        return processedCode;
    }
}

