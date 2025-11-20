// Button triggers the processing
// document.getElementById('processCodeButton').addEventListener('click', () => {
//     vscode.postMessage({ type: 'processCode' });
// });
(function() {
    'use strict';
        
    // acquireVsCodeApi must be called at the top level
    const vscode = acquireVsCodeApi();

    function init() {
        // Settings popup functionality
        const settingsButton = document.getElementById('settingsButton');
        const settingsPopup = document.getElementById('settingsPopup');
        const settingsOverlay = document.getElementById('settingsOverlay');
        const settingsClose = document.getElementById('settingsClose');

        if (settingsButton && settingsPopup && settingsOverlay) {
            settingsButton.addEventListener('click', () => {
                settingsPopup.classList.add('show');
                settingsOverlay.classList.add('show');
            });

            if (settingsClose) {
                settingsClose.addEventListener('click', () => {
                    settingsPopup.classList.remove('show');
                    settingsOverlay.classList.remove('show');
                });
            }

            if (settingsOverlay) {
                settingsOverlay.addEventListener('click', () => {
                    settingsPopup.classList.remove('show');
                    settingsOverlay.classList.remove('show');
                });
            }
        }

        // Run button (placeholder - functionality to be added later)
        const runButton = document.getElementById('runButton');
        if (runButton) {
            runButton.addEventListener('click', () => {
                vscode.postMessage({ type: 'processCode' });
            });
        }
    }

    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM is already ready
        init();
    }

    // Listen for messages from the extension
    window.addEventListener('message', event => {
        // const output = document.getElementById('output');
        // output.textContent = message.result;
        const message = event.data;
        if (message && message.type === 'processedResult') {
            // Handle processed results (functionality to be added later)
        }
    });
})();
