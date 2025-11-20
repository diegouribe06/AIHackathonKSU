import * as vscode from 'vscode';
import { OpenAI } from 'openai';

type Prompt = {
    initPrompt: string;
    code: string;
};

type Answer = {
    line_numbers: string | number | number[],
    issue_type: string,
    severity: "low" | "medium" | "high" | "critical",
    description: string,
    recommendation: string
};

/** Escape anything that would break a template literal or webview HTML */
function sanitizeForWebview(str: string): string {
    return str
        .replace(/`/g, "\\`")
        .replace(/\${/g, "\\${");
}

export class MainSidebarViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ermactually.mainSidebarView';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _context: vscode.ExtensionContext,
        private readonly _extensionUri: vscode.Uri
    ) {}

    /** ----------------------------------------------------
     *  SECRET STORAGE + OPENAI CLIENT
     * ---------------------------------------------------- */
    private async getOpenAIClient(): Promise<OpenAI | undefined> {
        const apiKey = await this._context.secrets.get('openaiApiKey');

        if (!apiKey) {
            vscode.window.showErrorMessage(
                "OpenAI API Key not set. Run: 'ErmActually: Set OpenAI API Key'"
            );
            return undefined;
        }

        return new OpenAI({ apiKey });
    }

    /** ----------------------------------------------------
     *  PROCESS ACTIVE FILE
     * ---------------------------------------------------- */
    private async processActiveFile(): Promise<Answer[] | string> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return "No active editor";

        const document = editor.document;
        const client = await this.getOpenAIClient();
        if (!client) return "Missing API key.";

        const prompt: Prompt = {
            initPrompt:
                "You are a real-time security auditor. Analyze only the code shown. " +
                "Detect any vulnerabilities. Output ONLY raw JSON (no backticks, no fences). " +
                "Format: [{ \"line_numbers\": \"...\", \"issue_type\": \"...\", \"severity\": \"low|medium|high|critical\", \"description\": \"...\", \"recommendation\": \"...\" }] " +
                "If no issues, output [].",
            code: document.getText()
        };

        try {
            const response = await client.responses.create({
                model: "gpt-4o",
                input: prompt.initPrompt + "\n\n" + prompt.code
            });

            // The model may return garbage – sanitize before parsing
            const raw = sanitizeForWebview(response.output_text.trim());

            // Try parsing JSON, fall back gracefully
            try {
                const issues = JSON.parse(raw) as Answer[];
                return issues;
            } catch (jsonErr) {
                console.warn("Model returned non-JSON. Returning raw string.", raw);
                return "Model returned invalid JSON: " + raw;
            }

        } catch (err) {
            console.error(err);
            return "Error contacting OpenAI: " + String(err);
        }
    }

    /** ----------------------------------------------------
     *  WEBVIEW SETUP
     * ---------------------------------------------------- */
    resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'media')
            ]
        };

        webviewView.webview.html = this.getHtml(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.type === "processCode") {
                webviewView.webview.postMessage({ type: "statusUpdate", status: "⚡ Processing..." });

                const result = await this.processActiveFile();

                webviewView.webview.postMessage({ type: "statusUpdate", status: "✓ Completed!" });
                webviewView.webview.postMessage({ type: "processedResult", result });
            }

            if (message.type === "openSettings") {
                vscode.commands.executeCommand('ermactually.openSettings');
            }
        });
    }

    /** ----------------------------------------------------
     *  HTML
     * ---------------------------------------------------- */
    private getHtml(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "style.css")
        );

        const nonce = this.getNonce();

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy"
                content="default-src 'none';
                         img-src ${webview.cspSource} data:;
                         style-src ${webview.cspSource} 'unsafe-inline';
                         script-src 'nonce-${nonce}' ${webview.cspSource};">
            <link href="${styleUri}" rel="stylesheet">
            <title>Ermactually</title>
        </head>
        <body>
            <div class="commit-status-section">
                <h2 class="commit-status-title">Commit Status:</h2>
                <div class="commit-status-box">
                    <span class="commit-status-text">⏳ Waiting...</span>
                </div>
                <p class="instruction-text">Put your API key in and select Run to get started.</p>
            </div>

            <div class="image-placeholder-container">
                <div class="image-placeholder">Image Placeholder</div>
            </div>

            <div class="vulnerabilities-section">
                <h3 class="vulnerabilities-title">Vulnerabilities</h3>

                <div class="vulnerabilities-box">
                    <div class="vulnerability-category">
                        <h4>Critical Vulnerability</h4>
                        <div id="criticalVulnContainer"></div>
                    </div>

                    <div class="vulnerability-category">
                        <h4>High Vulnerability</h4>
                        <div id="highVulnContainer"></div>
                    </div>

                    <div class="vulnerability-category">
                        <h4>Medium Vulnerability</h4>
                        <div id="mediumVulnContainer"></div>
                    </div>

                    <div class="vulnerability-category">
                        <h4>Low Vulnerability</h4>
                        <div id="lowVulnContainer"></div>
                    </div>
                </div>
            </div>

            <div class="bottom-actions">
                <button id="runButton">Run</button>
                <button id="settingsButton">⚙️</button>
            </div>

            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
    }

    private getNonce() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length: 32 }, () =>
            chars[Math.floor(Math.random() * chars.length)]
        ).join('');
    }

    /** Called by activate() when typing/pasting threshold triggers */
    public async triggerBackgroundAnalysis() {
        if (!this._view) return;

        const result = await this.processActiveFile();
        this._view.webview.postMessage({ type: "processedResult", result });
    }
}
