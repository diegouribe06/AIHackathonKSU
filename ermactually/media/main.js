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


    let genzModeEnabled = false;
    let currentIssues = [];

    function updateGenzImage() {
        const imageContainer = document.getElementById('imageContainer');
        const genzImage = document.getElementById('genzImage');
        
        if (!genzModeEnabled) {
            imageContainer.style.display = 'none';
            return;
        }

        imageContainer.style.display = 'block';
        
        if (!genzImage) return;
        
        // Get image URI from data attributes based on current status and issues
        const statusText = document.querySelector('.commit-status-text')?.textContent || '';
        let imageUri = '';
        
        // Check if processing/working
        if (statusText.includes('Processing') || statusText.includes('Working')) {
            imageUri = genzImage.getAttribute('data-thinking') || '';
        } else if (statusText.includes('Waiting')) {
            imageUri = genzImage.getAttribute('data-waiting') || '';
        } else if (currentIssues.length === 0) {
            // No errors - show big brain
            imageUri = genzImage.getAttribute('data-bigbrain') || '';
        } else {
            const critical = currentIssues.filter(i => i.severity === "critical");
            const high = currentIssues.filter(i => i.severity === "high");
            const medium = currentIssues.filter(i => i.severity === "medium");
            const low = currentIssues.filter(i => i.severity === "low");
            
            if (critical.length > 0) {
                imageUri = genzImage.getAttribute('data-sad') || '';
            } else if (high.length > 0) {
                imageUri = genzImage.getAttribute('data-thumbsdown') || '';
            } else if (medium.length > 0) {
                imageUri = genzImage.getAttribute('data-thumbsup') || '';
            } else if (low.length > 0) {
                // Only low errors - show happy hamster
                imageUri = genzImage.getAttribute('data-happy') || '';
            } else {
                imageUri = genzImage.getAttribute('data-waiting') || '';
            }
        }
        
        if (imageUri) {
            genzImage.src = imageUri;
        }
    }

    function init() {
        // Settings button - opens settings panel
        const settingsButton = document.getElementById('settingsButton');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                vscode.postMessage({ type: 'openSettings' });
            });
        }

        // Run button
        const runButton = document.getElementById('runButton');
        if (runButton) {
            runButton.addEventListener('click', () => {
    vscode.postMessage({ type: 'processCode' });
});
        }

        // GenZ Mode toggle
        const genzToggle = document.getElementById('genzModeToggle');
        if (genzToggle) {
            genzToggle.addEventListener('click', () => {
                genzModeEnabled = !genzModeEnabled;
                genzToggle.classList.toggle('active');
                updateGenzImage();
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

    // Function to apply light mode
    function applyLightMode(isLightMode) {
        document.body.classList.toggle('light-mode', isLightMode);
    }

    // Function to apply custom colors
    function applyColors(colors) {
        // Create or update style element
        let styleElement = document.getElementById('custom-severity-colors');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'custom-severity-colors';
            document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = `
            .severity-critical {
                color: ${colors.critical} !important;
                border-left-color: ${colors.critical} !important;
            }
            .severity-critical .issue-severity {
                color: ${colors.critical} !important;
            }
            .severity-high {
                color: ${colors.high} !important;
                border-left-color: ${colors.high} !important;
            }
            .severity-high .issue-severity {
                color: ${colors.high} !important;
            }
            .severity-medium {
                color: ${colors.medium} !important;
                border-left-color: ${colors.medium} !important;
            }
            .severity-medium .issue-severity {
                color: ${colors.medium} !important;
            }
            .severity-low {
                color: ${colors.low} !important;
                border-left-color: ${colors.low} !important;
            }
            .severity-low .issue-severity {
                color: ${colors.low} !important;
            }
        `;
    }

// Listen for messages from the extension
window.addEventListener('message', event => {
    const message = event.data;

        if (message.type === "statusUpdate") {
            // Update commit status
            updateCommitStatus(message.status);
            // Update image when status changes
            updateGenzImage();
        } else if (message.type === "lightModeChanged") {
            // Apply light mode to main sidebar view
            applyLightMode(message.lightMode);
        } else if (message.type === "colorsChanged") {
            // Apply custom colors to severity classes
            applyColors(message.colors);
        } else if (message.type === "processedResult") {
            const issues = message.result;

            if (!Array.isArray(issues)) {
                console.error("Invalid issues:", issues);
                return;
            }

            // Store current issues for image selection
            currentIssues = issues;
            
            const critical = issues.filter(i => i.severity === "critical");
            const high     = issues.filter(i => i.severity === "high");
            const medium   = issues.filter(i => i.severity === "medium");
            const low      = issues.filter(i => i.severity === "low");
            
            // Update GenZ image after processing
            updateGenzImage();

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
