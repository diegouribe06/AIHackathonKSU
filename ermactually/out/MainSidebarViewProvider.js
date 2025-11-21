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
    _context;
    _extensionUri;
    static viewType = 'ermactually.mainSidebarView';
    _view;
    constructor(agent, _context, _extensionUri) {
        this.agent = agent;
        this._context = _context;
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
        // Load light mode setting on initialization
        this.loadLightMode(webviewView.webview);
        // Load colors on initialization
        this.loadColors(webviewView.webview);
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
        // GenZ mode images
        const waitingHamsterUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "waiting_hamster.png"));
        const thinkingHamsterUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "thinking_hamster.png"));
        const bigBrainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "big_brain.png"));
        const happyHamsterUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "happy_hamster.png"));
        const thumbsUpUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "thumbs_up.png"));
        const thumbsDownUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "thumbs_down.png"));
        const sadHamsterUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "sad_hampster.png"));
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
                
                <div class="genz-mode-toggle">
                    <span class="genz-mode-label">GenZ Mode</span>
                    <button class="settings-toggle" id="genzModeToggle">
                        <span class="settings-toggle-slider"></span>
                    </button>
                </div>
            </div>

            <div class="image-placeholder-container" id="imageContainer" style="display: none;">
                <img id="genzImage" class="genz-image" src="${waitingHamsterUri}" alt="GenZ Mode Image" data-waiting="${waitingHamsterUri}" data-thinking="${thinkingHamsterUri}" data-bigbrain="${bigBrainUri}" data-happy="${happyHamsterUri}" data-thumbsup="${thumbsUpUri}" data-thumbsdown="${thumbsDownUri}" data-sad="${sadHamsterUri}" />
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
    /** Load and apply light mode setting */
    async loadLightMode(webview) {
        const settings = this._context.workspaceState.get('ermactually.settings', {
            lightMode: false,
            textSize: 100,
            importantColor: '#ff8c00',
            warningColor: '#ffd700',
            safeColor: '#90ee90'
        });
        webview.postMessage({ type: 'lightModeChanged', lightMode: settings.lightMode });
    }
    /** Update light mode when command is called */
    async updateLightMode(lightMode) {
        if (this._view) {
            this._view.webview.postMessage({ type: 'lightModeChanged', lightMode });
        }
    }
    /** Update colors when command is called */
    async updateColors(settings) {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'colorsChanged',
                colors: {
                    critical: settings.criticalColor || '#ff4500',
                    high: settings.highColor || '#ff8c00',
                    medium: settings.mediumColor || '#ffd700',
                    low: settings.lowColor || '#32cd32'
                }
            });
        }
    }
    /** Load and apply colors on initialization */
    async loadColors(webview) {
        const settings = this._context.workspaceState.get('ermactually.settings', {
            criticalColor: '#ff4500',
            highColor: '#ff8c00',
            mediumColor: '#ffd700',
            lowColor: '#32cd32'
        });
        webview.postMessage({
            type: 'colorsChanged',
            colors: {
                critical: settings.criticalColor || '#ff4500',
                high: settings.highColor || '#ff8c00',
                medium: settings.mediumColor || '#ffd700',
                low: settings.lowColor || '#32cd32'
            }
        });
    }
}
exports.MainSidebarViewProvider = MainSidebarViewProvider;
//# sourceMappingURL=MainSidebarViewProvider.js.map