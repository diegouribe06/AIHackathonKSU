import * as vscode from 'vscode';

export class SettingsPanelProvider {
    private static currentPanel: vscode.WebviewPanel | undefined = undefined;

    public static createSettingsPanel(
        context: vscode.ExtensionContext,
        extensionUri: vscode.Uri
    ): vscode.WebviewPanel {
        // If panel already exists, reveal it instead of creating a new one
        if (SettingsPanelProvider.currentPanel) {
            SettingsPanelProvider.currentPanel.reveal(vscode.ViewColumn.Beside);
            return SettingsPanelProvider.currentPanel;
        }

        // Create new panel in a separate editor group (popup-like behavior)
        const panel = vscode.window.createWebviewPanel(
            'ermactuallySettings',
            'ErmActually Settings',
            {
                viewColumn: vscode.ViewColumn.Beside,
                preserveFocus: false
            },
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
                retainContextWhenHidden: true
            }
        );

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
                    break;
                case 'loadSettings':
                    const settings = context.workspaceState.get('ermactually.settings', {
                        lightMode: false,
                        textSize: 100,
                        importantColor: '#ff8c00',
                        warningColor: '#ffd700',
                        safeColor: '#90ee90'
                    });
                    panel.webview.postMessage({ type: 'settingsLoaded', settings });
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

    private static getSettingsHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(extensionUri, "media", "settings.js")
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(extensionUri, "media", "style.css")
        );

        const nonce = SettingsPanelProvider.getNonce();

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
                    <h3 class="settings-section-title">Text Size</h3>
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
                    <h3 class="settings-section-title">Vulnerability Colors</h3>
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

                <div class="settings-actions">
                    <button id="saveSettingsButton" class="settings-save-button">Save Settings</button>
                </div>
            </div>

            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
    }

    private static getNonce(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length: 32 }, () =>
            chars[Math.floor(Math.random() * chars.length)]
        ).join('');
    }
}

