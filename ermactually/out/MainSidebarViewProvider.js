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
/** Escape anything that would break a template literal or webview HTML */
function sanitizeForWebview(str) {
    return str
        .replace(/`/g, "\\`")
        .replace(/\${/g, "\\${");
}
class MainSidebarViewProvider {
    agent;
    _extensionUri;
    static viewType = 'ermactually.mainSidebarView';
    _view;
    constructor(agent, _extensionUri) {
        this.agent = agent;
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, _context, _token) {
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
                const result = await this.agent.processActiveFile();
                // Update status
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
    getHtml(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "main.js"));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "style.css"));
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
    getNonce() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
    /** Called by activate() when typing/pasting threshold triggers */
    async triggerBackgroundAnalysis() {
        if (!this._view)
            return;
        const result = await this.agent.processActiveFile();
        this._view.webview.postMessage({ type: "processedResult", result });
    }
}
exports.MainSidebarViewProvider = MainSidebarViewProvider;
//# sourceMappingURL=MainSidebarViewProvider.js.map