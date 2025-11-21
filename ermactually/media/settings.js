//ADDED

(function() {
    'use strict';
    
    const vscode = acquireVsCodeApi();

    function init() {
        // Request settings when view opens
        vscode.postMessage({ type: 'loadSettings' });

        // Light mode toggle
        const lightModeToggle = document.getElementById('lightModeToggle');
        if (lightModeToggle) {
            lightModeToggle.addEventListener('click', () => {
                lightModeToggle.classList.toggle('active');
                const isLightMode = lightModeToggle.classList.contains('active');
                
                // Apply light mode immediately to settings panel
                applyLightMode(isLightMode);
                
                // Notify extension of light mode change
                vscode.postMessage({ 
                    type: 'lightModeChanged', 
                    lightMode: isLightMode 
                });
            });
        }

        // Auto-scan toggle
        const autoScanToggle = document.getElementById('autoScanToggle');
        if (autoScanToggle) {
            autoScanToggle.addEventListener('click', () => {
                autoScanToggle.classList.toggle('active');
            });
        }

        function applyLightMode(isLightMode) {
            document.body.classList.toggle('light-mode', isLightMode);
        }

        // Save settings button
        const saveButton = document.getElementById('saveSettingsButton');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                const criticalColorPicker = document.getElementById('criticalColorPicker');
                const highColorPicker = document.getElementById('highColorPicker');
                const mediumColorPicker = document.getElementById('mediumColorPicker');
                const lowColorPicker = document.getElementById('lowColorPicker');

                const settings = {
                    lightMode: lightModeToggle?.classList.contains('active') || false,
                    autoScan: autoScanToggle?.classList.contains('active') !== false,
                    criticalColor: criticalColorPicker?.value || '#ff4500',
                    highColor: highColorPicker?.value || '#ff8c00',
                    mediumColor: mediumColorPicker?.value || '#ffd700',
                    lowColor: lowColorPicker?.value || '#32cd32'
                };
                vscode.postMessage({ type: 'saveSettings', settings });
            });
        }
    }

    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Listen for messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        if (message && message.type === 'lightModeChanged') {
            // Apply light mode when received
            applyLightMode(message.lightMode);
            // Update toggle state
            const lightModeToggle = document.getElementById('lightModeToggle');
            if (lightModeToggle) {
                if (message.lightMode) {
                    lightModeToggle.classList.add('active');
                } else {
                    lightModeToggle.classList.remove('active');
                }
            }
        } else if (message && message.type === 'settingsLoaded') {
            // Load settings into UI
            const settings = message.settings;
            
            const lightModeToggle = document.getElementById('lightModeToggle');
            if (lightModeToggle) {
                if (settings.lightMode) {
                    lightModeToggle.classList.add('active');
                } else {
                    lightModeToggle.classList.remove('active');
                }
                // Apply light mode to settings panel
                document.body.classList.toggle('light-mode', settings.lightMode);
            }

            const autoScanToggle = document.getElementById('autoScanToggle');
            if (autoScanToggle) {
                if (settings.autoScan !== false) {
                    autoScanToggle.classList.add('active');
                } else {
                    autoScanToggle.classList.remove('active');
                }
            }

            const criticalColorPicker = document.getElementById('criticalColorPicker');
            const highColorPicker = document.getElementById('highColorPicker');
            const mediumColorPicker = document.getElementById('mediumColorPicker');
            const lowColorPicker = document.getElementById('lowColorPicker');
            
            if (criticalColorPicker && settings.criticalColor) {
                criticalColorPicker.value = settings.criticalColor;
            }
            if (highColorPicker && settings.highColor) {
                highColorPicker.value = settings.highColor;
            }
            if (mediumColorPicker && settings.mediumColor) {
                mediumColorPicker.value = settings.mediumColor;
            }
            if (lowColorPicker && settings.lowColor) {
                lowColorPicker.value = settings.lowColor;
            }
        }
    });
})();

