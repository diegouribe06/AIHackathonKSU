"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainSidebarViewProvider = void 0;
const vscode = __importStar(require("vscode"));
class MainSidebarViewProvider {
    agent;
    _extensionUri;
    static viewType = 'ermactually.mainSidebarView';
    _view;
    constructor(agent, _extensionUri) {
        this.agent = agent;
        this._extensionUri = _extensionUri;
    }
    /** ----------------------------
     *  SECRET STORAGE + OPENAI CLIENT
     *  ---------------------------- */
    // private async getOpenAIClient(): Promise<OpenAI | undefined> {
    //     const apiKey = await this._context.secrets.get('openaiApiKey');
    //     if (!apiKey) {
    //         vscode.window.showErrorMessage(
    //             "OpenAI API Key not set. Run: 'ErmActually: Set OpenAI API Key'"
    //         );
    //         return undefined;
    //     }
    //     return new OpenAI({ apiKey });
    // }
    // /** ----------------------------
    //  *  PROCESS ACTIVE FILE
    //  *  ---------------------------- */
    // private async processActiveFile(): Promise<string> {
    //     const editor = vscode.window.activeTextEditor;
    //     if (!editor) {
    //         return "No active editor";
    //     }
    //     const document = editor.document;
    //     const client = await this.getOpenAIClient();
    //     if (!client) {
    //         return "Missing API key.";
    //     }
    //     const prompt: Prompt = {
    //         initPrompt: "Analyze the following code and provide insights:",
    //         code: document.getText()
    //     };
    //     try {
    //         const response = await client.responses.create({
    //             model: "gpt-4o",
    //             input: prompt.initPrompt + "\n\n" + prompt.code
    //         });
    //         return response.output_text;
    //     } catch (err) {
    //         console.error(err);
    //         return "Error contacting OpenAI: " + String(err);
    //     }
    // }
    /** ----------------------------
     *  WEBVIEW SETUP
     *  ---------------------------- */
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')]
        };
        webviewView.webview.html = this.getHtml(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.type === "processCode") {
                const result = await this.agent.processActiveFile();
                webviewView.webview.postMessage({ type: "processedResult", result });
            }
        });
    }
    /** ----------------------------
     *  HTML
     *  ---------------------------- */
    getHtml(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "main.js"));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "style.css"));
        const nonce = this.getNonce();
        return /*html*/ `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" 
                content="
                    default-src 'none'; 
                    script-src 'nonce-${nonce}' ${webview.cspSource}; 
                    style-src ${webview.cspSource} 'unsafe-inline'; 
                    img-src ${webview.cspSource} data:;">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ermactually</title>
            <link href="${styleUri}" rel="stylesheet">
        </head>
        <body>
            <!-- Commit Status Section -->
            <div class="commit-status-section">
                <h2 class="commit-status-title">Commit Status:</h2>
                <div class="commit-status-box">
                    <span class="commit-status-text">✓ Waiting</span>
                </div>
            </div>

            <!-- Image Placeholder -->
            <div class="image-placeholder-container">
                <div class="image-placeholder">
                    Image Placeholder
                </div>
            </div>

            <!-- Vulnerabilities Section -->
            <div class="vulnerabilities-section">
                <h3 class="vulnerabilities-title">Vulnerabilities</h3>
                <div class="vulnerabilities-box">
                    <div class="vulnerability-category">
                        <h4 class="vulnerability-category-title">Most Important Vulnerabilities</h4>
                        <p class="vulnerability-category-content vulnerability-important" id="importantVulns">There is no current issues</p>
                    </div>
                    <div class="vulnerability-category">
                        <h4 class="vulnerability-category-title">Warning Vulnerabilities</h4>
                        <p class="vulnerability-category-content vulnerability-warning" id="warningVulns">There is no current issues</p>
                    </div>
                    <div class="vulnerability-category">
                        <h4 class="vulnerability-category-title">Not a Vulnerability</h4>
                        <p class="vulnerability-category-content vulnerability-safe" id="safeVulns">There is no current issues</p>
                    </div>
                </div>
            </div>

            <!-- Bottom Action Buttons -->
            <div class="bottom-actions">
                <button id="runButton">Run</button>
                <button id="settingsButton">⚙️</button>
            </div>

            <!-- Settings Overlay -->
            <div class="settings-overlay" id="settingsOverlay"></div>

            <!-- Settings Popup -->
            <div class="settings-popup" id="settingsPopup">
                <div class="settings-popup-header">
                    <h3 class="settings-popup-title">Settings</h3>
                    <button class="settings-popup-close" id="settingsClose">×</button>
                </div>
                
                <div class="settings-section">
                    <h4 class="settings-section-title">Appearance</h4>
                    <div class="settings-option">
                        <span class="settings-option-label">Light Mode</span>
                        <button class="settings-toggle" id="lightModeToggle">
                            <span class="settings-toggle-slider"></span>
                        </button>
                    </div>
                </div>

                <div class="settings-section">
                    <h4 class="settings-section-title">Text Size</h4>
                    <div class="settings-option">
                        <span class="settings-option-label">Adjust Text Size</span>
                        <div class="settings-text-size-controls">
                            <button class="settings-text-size-button" id="decreaseTextSize">-</button>
                            <span class="settings-text-size-display" id="textSizeDisplay">100%</span>
                            <button class="settings-text-size-button" id="increaseTextSize">+</button>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h4 class="settings-section-title">Vulnerability Colors</h4>
                    <div class="settings-option">
                        <span class="settings-option-label">Most Important</span>
                        <div class="color-picker-container">
                            <input type="color" class="color-picker" id="importantColorPicker" value="#ff8c00">
                        </div>
                    </div>
                    <div class="settings-option">
                        <span class="settings-option-label">Warning</span>
                        <div class="color-picker-container">
                            <input type="color" class="color-picker" id="warningColorPicker" value="#ffd700">
                        </div>
                    </div>
                    <div class="settings-option">
                        <span class="settings-option-label">Not a Vulnerability</span>
                        <div class="color-picker-container">
                            <input type="color" class="color-picker" id="safeColorPicker" value="#90ee90">
                        </div>
                    </div>
                </div>
            </div>

            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
    }
    getNonce() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
}
exports.MainSidebarViewProvider = MainSidebarViewProvider;
//# sourceMappingURL=MainSidebarViewProvider.js.map