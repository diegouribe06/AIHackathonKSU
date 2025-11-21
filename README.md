# Hamster Helper

Hamster Helper is a small VS Code extension that scans the active file for potential security vulnerabilities using an AI backend and displays categorized findings in a sidebar view.

**Key features**
- Runs an AI-based analysis of the active editor and lists detected issues grouped by severity.
- Live color customization for severity levels (including a new `Critical` color).
- Adjustable text size (percentage) for the sidebar UI — changes persist across sessions.
- Light / Dark mode toggle that syncs between the dedicated settings panel and the sidebar view.
- Settings persist to workspace state and update all views live.

**Note:** This extension requires an OpenAI API key to contact the AI service. Save it via the `ErmActually: Set OpenAI API Key` command.

**Commands**
- `ErmActually` — simple example command (included by default).
- `ErmActually: Set OpenAI API Key` — store your OpenAI API key securely using VS Code secret storage.
- `ErmActually: Open Settings` — opens the dedicated settings panel.

**Settings (UI-driven)**
- Critical Color: choose the color used for `critical` severity items (new option).
- Most Important / Warning / Not a Vulnerability: colors for other severities.
- Text Size: increase or decrease the sidebar UI font size (percentage). Changes are applied immediately and persisted.
- Light Mode: toggle appearance; this syncs between the settings panel and the sidebar view and persists across sessions.

Getting started
- Set your OpenAI API key with the command palette: `ErmActually: Set OpenAI API Key`.
- Open the `Erm View` from the Activity Bar (or run the `ErmActually` command).
- Use the settings button in the sidebar (⚙️) to change colors, text size, or light/dark mode. The sidebar updates live when settings change.

Developer / testing notes
- Build the extension (from the workspace root):

```powershell
npm run compile
```

- Launch the Extension Development Host from VS Code's run/debug (press F5).
- If you change settings in the dedicated Settings panel, the extension persists them and forwards updates to the sidebar so changes apply immediately.

Implementation details
- Settings are stored in `context.workspaceState` under the `ermactually.settings` key.
- The sidebar webview requests settings on load and also listens for `settings` messages to apply updates (colors, text size, theme).
- The settings panel sends `saveSettings` messages which update stored settings and notify the sidebar to update live.

Privacy & Security
- The OpenAI API key is stored using VS Code's secret storage and is never logged or included in telemetry.

Contributing
- Feel free to open issues or pull requests on the repository. Small, focused PRs with tests are easiest to review.

License
- Add your preferred license here.

Enjoy!
