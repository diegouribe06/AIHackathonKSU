const vscode = acquireVsCodeApi();

// Button triggers the processing
document.getElementById('processCodeButton').addEventListener('click', () => {
    vscode.postMessage({ type: 'processCode' });
});

// Listen for messages from the extension
window.addEventListener('message', event => {
    const message = event.data;
    if (message.type === 'processedResult') {
        const output = document.getElementById('output');
        output.textContent = message.result;
    }
});
