import * as vscode from 'vscode';
import { OpenAI } from 'openai';
import { Agent } from './PromptWrapper';


export class MainSidebarViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ermactually.mainSidebarView';

    private _view?: vscode.WebviewView;

    constructor(
        private agent: Agent,
        private readonly _extensionUri: vscode.Uri
    ) {}

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
                // Update status to "Working"
                webviewView.webview.postMessage({ type: "statusUpdate", status: "⚡ Processing..." });
                
                const result = await this.agent.processActiveFile();
                
                // Update status to "Complete!" when done
                webviewView.webview.postMessage({ type: "statusUpdate", status: "✓ Completed!" });
                webviewView.webview.postMessage({ type: "processedResult", result });
            } else if (message.type === "openSettings") {
                // Open settings panel
                vscode.commands.executeCommand('ermactually.openSettings');
            }
        });
    }

    /** ----------------------------
     *  HTML
     *  ---------------------------- */
    private getHtml(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "style.css")
        );

        const nonce = this.getNonce();

        return /*html*/`
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
                    <span class="commit-status-text">⏳ Waiting...</span>
                </div>
                <p class="instruction-text">Put your API key in and select Run to get started.</p>
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
                
                <!-- throw the extra class back in there to work -->
                
                <div class="vulnerabilities-box">
                    <div class="vulnerability-category">
                        <h4 class="vulnerability-category-title">Critical Vulnerability</h4>
                        <div id="criticalVulnContainer" class="vulnerability-list"></div>
                    </div>

                    <div class="vulnerability-category">
                        <h4 class="vulnerability-category-title">High Vulnerability</h4>
                        <div id="highVulnContainer" class="vulnerability-list"></div>
                    </div>

                    <div class="vulnerability-category">
                        <h4 class="vulnerability-category-title">Medium Vulnerability</h4>
                        <div id="mediumVulnContainer" class="vulnerability-list"></div>
                    </div>

                    <div class="vulnerability-category">
                        <h4 class="vulnerability-category-title">Low Vulnerability</h4>
                        <div id="lowVulnContainer" class="vulnerability-list"></div>
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

    private getNonce() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length: 32 }, () =>
            chars[Math.floor(Math.random() * chars.length)]
        ).join('');
    }
}
