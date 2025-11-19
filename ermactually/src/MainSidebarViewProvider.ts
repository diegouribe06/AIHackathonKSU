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
        <body>
            <h1>Hello World from ErmActually!</h1>
            <button id="processCodeButton">Process Active File</button>
            <pre id="output"></pre>
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

