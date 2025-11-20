//ADDED

(function() {
    'use strict';
    
    const vscode = acquireVsCodeApi();

    let textSize = 100;

    function init() {
        // Request settings when view opens
        vscode.postMessage({ type: 'loadSettings' });

        // Light mode toggle
        const lightModeToggle = document.getElementById('lightModeToggle');
        if (lightModeToggle) {
            lightModeToggle.addEventListener('click', () => {
                lightModeToggle.classList.toggle('active');
            });
        }

        // Text size controls
        const decreaseButton = document.getElementById('decreaseTextSize');
        const increaseButton = document.getElementById('increaseTextSize');
        const textSizeDisplay = document.getElementById('textSizeDisplay');

        if (decreaseButton && increaseButton && textSizeDisplay) {
            decreaseButton.addEventListener('click', () => {
                if (textSize > 50) {
                    textSize -= 10;
                    textSizeDisplay.textContent = textSize + '%';
                }
            });

            increaseButton.addEventListener('click', () => {
                if (textSize < 200) {
                    textSize += 10;
                    textSizeDisplay.textContent = textSize + '%';
                }
            });
        }

        // Save settings button
        const saveButton = document.getElementById('saveSettingsButton');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                const importantColorPicker = document.getElementById('importantColorPicker');
                const warningColorPicker = document.getElementById('warningColorPicker');
                const safeColorPicker = document.getElementById('safeColorPicker');

                const settings = {
                    lightMode: lightModeToggle?.classList.contains('active') || false,
                    textSize: textSize,
                    importantColor: importantColorPicker?.value || '#ff8c00',
                    warningColor: warningColorPicker?.value || '#ffd700',
                    safeColor: safeColorPicker?.value || '#90ee90'
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
        if (message && message.type === 'settingsLoaded') {
            // Load settings into UI
            const settings = message.settings;
            
            const lightModeToggle = document.getElementById('lightModeToggle');
            if (lightModeToggle) {
                if (settings.lightMode) {
                    lightModeToggle.classList.add('active');
                } else {
                    lightModeToggle.classList.remove('active');
                }
            }

            const textSizeDisplay = document.getElementById('textSizeDisplay');
            if (textSizeDisplay && settings.textSize) {
                textSize = settings.textSize;
                textSizeDisplay.textContent = textSize + '%';
            }

            const importantColorPicker = document.getElementById('importantColorPicker');
            const warningColorPicker = document.getElementById('warningColorPicker');
            const safeColorPicker = document.getElementById('safeColorPicker');
            
            if (importantColorPicker && settings.importantColor) {
                importantColorPicker.value = settings.importantColor;
            }
            if (warningColorPicker && settings.warningColor) {
                warningColorPicker.value = settings.warningColor;
            }
            if (safeColorPicker && settings.safeColor) {
                safeColorPicker.value = settings.safeColor;
            }
        }
    });
})();

