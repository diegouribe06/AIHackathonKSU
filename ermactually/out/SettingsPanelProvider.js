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
exports.SettingsPanelProvider = void 0;
const vscode = __importStar(require("vscode"));
class SettingsPanelProvider {
    static currentPanel = undefined;
    static createSettingsPanel(context, extensionUri) {
        // If panel already exists, reveal it instead of creating a new one
        if (SettingsPanelProvider.currentPanel) {
            SettingsPanelProvider.currentPanel.reveal(vscode.ViewColumn.Beside);
            return SettingsPanelProvider.currentPanel;
        }
        // Create new panel in a separate editor group (popup-like behavior)
        const panel = vscode.window.createWebviewPanel('ermactuallySettings', 'ErmActually Settings', {
            viewColumn: vscode.ViewColumn.Beside,
            preserveFocus: false
        }, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
            retainContextWhenHidden: true
        });
        // Track the panel and clean up when it's disposed
        SettingsPanelProvider.currentPanel = panel;
        panel.onDidDispose(() => {
            SettingsPanelProvider.currentPanel = undefined;
        });
        panel.webview.html = SettingsPanelProvider.getSettingsHtml(panel.webview, extensionUri);
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'saveSettings':
                    await context.workspaceState.update('ermactually.settings', message.settings);
                    vscode.window.showInformationMessage('Settings saved successfully!');
                    // Broadcast light mode change
                    vscode.commands.executeCommand('ermactually.updateLightMode', message.settings.lightMode);
                    // Broadcast color changes
                    vscode.commands.executeCommand('ermactually.updateColors', message.settings);
                    // Apply to settings panel
                    panel.webview.postMessage({ type: 'lightModeChanged', lightMode: message.settings.lightMode });
                    break;
                case 'loadSettings':
                    const settings = context.workspaceState.get('ermactually.settings', {
                        lightMode: false,
                        autoScan: true,
                        criticalColor: '#ff4500',
                        highColor: '#ff8c00',
                        mediumColor: '#ffd700',
                        lowColor: '#32cd32'
                    });
                    panel.webview.postMessage({ type: 'settingsLoaded', settings });
                    // Also send light mode change to apply immediately
                    panel.webview.postMessage({ type: 'lightModeChanged', lightMode: settings.lightMode });
                    break;
                case 'lightModeChanged':
                    // Save light mode immediately when toggled
                    const currentSettings = context.workspaceState.get('ermactually.settings', {
                        lightMode: false,
                        autoScan: true,
                        criticalColor: '#ff4500',
                        highColor: '#ff8c00',
                        mediumColor: '#ffd700',
                        lowColor: '#32cd32'
                    });
                    currentSettings.lightMode = message.lightMode;
                    await context.workspaceState.update('ermactually.settings', currentSettings);
                    // Broadcast to main sidebar view
                    vscode.commands.executeCommand('ermactually.updateLightMode', message.lightMode);
                    break;
            }
        });
        // Load settings when panel becomes visible
        panel.onDidChangeViewState(() => {
            if (panel.visible) {
                const settings = context.workspaceState.get('ermactually.settings', {
                    lightMode: false,
                    textSize: 100,
                    importantColor: '#ff8c00',
                    warningColor: '#ffd700',
                    safeColor: '#90ee90'
                });
                panel.webview.postMessage({ type: 'settingsLoaded', settings });
                // Also send light mode change to apply immediately
                panel.webview.postMessage({ type: 'lightModeChanged', lightMode: settings.lightMode });
            }
        });
        // Initial load after a short delay to ensure webview is ready
        setTimeout(() => {
            const settings = context.workspaceState.get('ermactually.settings', {
                lightMode: false,
                textSize: 100,
                importantColor: '#ff8c00',
                warningColor: '#ffd700',
                safeColor: '#90ee90'
            });
            panel.webview.postMessage({ type: 'settingsLoaded', settings });
        }, 100);
        return panel;
    }
    static getSettingsHtml(webview, extensionUri) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "settings.js"));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "style.css"));
        const nonce = SettingsPanelProvider.getNonce();
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
            <title>ErmActually Settings</title>
            <link href="${styleUri}" rel="stylesheet">
        </head>
        <body>
            <div class="settings-container">
                <h2 class="settings-header">ErmActually Settings</h2>
                
                <div class="settings-section">
                    <h3 class="settings-section-title">Appearance</h3>
                    <div class="settings-option">
                        <span class="settings-option-label">Light Mode</span>
                        <button class="settings-toggle" id="lightModeToggle">
                            <span class="settings-toggle-slider"></span>
                        </button>
                    </div>
                </div>

                <div class="settings-section">
                    <h3 class="settings-section-title">Scanning</h3>
                    <div class="settings-option">
                        <span class="settings-option-label">Auto-Scan</span>
                        <button class="settings-toggle" id="autoScanToggle">
                            <span class="settings-toggle-slider"></span>
                        </button>
                    </div>
                </div>

                <div class="settings-section">
                    <h3 class="settings-section-title">Vulnerability Colors</h3>
                    <div class="settings-option">
                        <span class="settings-option-label">Critical</span>
                        <div class="color-picker-container">
                            <input type="color" class="color-picker" id="criticalColorPicker" value="#ff4500">
                        </div>
                    </div>
                    <div class="settings-option">
                        <span class="settings-option-label">High</span>
                        <div class="color-picker-container">
                            <input type="color" class="color-picker" id="highColorPicker" value="#ff8c00">
                        </div>
                    </div>
                    <div class="settings-option">
                        <span class="settings-option-label">Medium</span>
                        <div class="color-picker-container">
                            <input type="color" class="color-picker" id="mediumColorPicker" value="#ffd700">
                        </div>
                    </div>
                    <div class="settings-option">
                        <span class="settings-option-label">Low</span>
                        <div class="color-picker-container">
                            <input type="color" class="color-picker" id="lowColorPicker" value="#32cd32">
                        </div>
                    </div>
                </div>

                <div class="settings-actions">
                    <button id="saveSettingsButton" class="settings-save-button">Save Settings</button>
                </div>
            </div>

            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
    }
    static getNonce() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
}
exports.SettingsPanelProvider = SettingsPanelProvider;
//# sourceMappingURL=SettingsPanelProvider.js.map