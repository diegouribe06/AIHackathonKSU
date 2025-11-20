// Button triggers the processing
// document.getElementById('processCodeButton').addEventListener('click', () => {
//     vscode.postMessage({ type: 'processCode' });
// });
(function() {
    'use strict';
        
    // acquireVsCodeApi must be called at the top level
    const vscode = acquireVsCodeApi();

    function renderIssue(issue) {
        // Add severity class for color coding
        const severityClass = `severity-${issue.severity}`;
        
        return `
        <!-- formatting of how its displaying  -->
        <!-- <div class="issue-item"> -->
            <div class="issue-item ${severityClass}">
                <div class="issue-header">
                    <span class="issue-type">${issue.issue_type}</span>
                    <span class="issue-severity">${issue.severity}</span>
                </div>
                <div class="issue-lines">Lines: ${issue.line_numbers}</div>
                <div class="issue-description">${issue.description}</div>
                <div class="issue-reco"><em>${issue.recommendation}</em></div>
            </div>
        `;
    }


    function init() {
        // Settings button - opens settings panel
        const settingsButton = document.getElementById('settingsButton');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                vscode.postMessage({ type: 'openSettings' });
            });
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

    // Function to update commit status
    function updateCommitStatus(status) {
        const statusElement = document.querySelector('.commit-status-text');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    // Listen for messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;

        if (message.type === "statusUpdate") {
            // Update commit status
            updateCommitStatus(message.status);
        } else if (message.type === "processedResult") {
            const issues = message.result;

            if (!Array.isArray(issues)) {
                console.error("Invalid issues:", issues);
                return;
            }

            // const important = issues.filter(i => ["critical", "high"].includes(i.severity));
            // const warning   = issues.filter(i => i.severity === "medium");
            // const safe      = issues.filter(i => i.severity === "low");
            
            const critical = issues.filter(i => i.severity === "critical");
            const high     = issues.filter(i => i.severity === "high");
            const medium   = issues.filter(i => i.severity === "medium");
            const low      = issues.filter(i => i.severity === "low");

            //individual classes for each type of issue container
           
            // document.getElementById("importantVulnContainer").innerHTML =
            // important.length ? important.map(renderIssue).join("") : `<p class="vulnerability-empty">No issues found</p>`;
           
            document.getElementById("criticalVulnContainer").innerHTML =
                critical.length ? critical.map(renderIssue).join("") : `<p class="vulnerability-empty">No issues found</p>`;

            // document.getElementById("warningVulnContainer").innerHTML =
            // warning.length ? warning.map(renderIssue).join("") : `<p class="vulnerability-empty">No issues found</p>`;
                
            document.getElementById("highVulnContainer").innerHTML =
                high.length ? high.map(renderIssue).join("") : `<p class="vulnerability-empty">No issues found</p>`;

            document.getElementById("mediumVulnContainer").innerHTML =
                medium.length ? medium.map(renderIssue).join("") : `<p class="vulnerability-empty">No issues found</p>`;
            
            // document.getElementById("safeVulnContainer").innerHTML =
            // safe.length ? safe.map(renderIssue).join("") : `<p class="vulnerability-empty">No issues found</p>`;
            document.getElementById("lowVulnContainer").innerHTML =
                low.length ? low.map(renderIssue).join("") : `<p class="vulnerability-empty">No issues found</p>`;
        }
    });
})();
