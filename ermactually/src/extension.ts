// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { MainSidebarViewProvider } from './MainSidebarViewProvider';
import {Agent} from './PromptWrapper';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const agent = new Agent(context);
	const mainSidebarViewProvider = new MainSidebarViewProvider(agent, context.extensionUri);
	
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			MainSidebarViewProvider.viewType,
			mainSidebarViewProvider
		)
	);

	//Character counting and paste monitoring
	let charSinceLastRun = 0;

	// Matches ONLY whitespace and newlines
	const onlyWhitespaceOrNewline = /^[\s\n\r]*$/;

	vscode.workspace.onDidChangeTextDocument((event) => {
		const active = vscode.window.activeTextEditor;
		if (!active || event.document !== active.document) return;

		for (const change of event.contentChanges) {
			const inserted = change.text;

			// --- ENTER / TAB DETECTION — SKIP THESE ---
			const noRealTextInserted = inserted.length === 0 || onlyWhitespaceOrNewline.test(inserted);
			const onlyNewlinesOrSpaces = onlyWhitespaceOrNewline.test(inserted);
			const textWasDeleted = change.rangeLength > 0;

			if (onlyNewlinesOrSpaces && !(!onlyNewlinesOrSpaces && textWasDeleted)) {
				// Skip pure whitespace/newline insertions (ENTER/TAB)
				continue;
			}

			// --- PASTE DETECTION ---
			// Multi-character text OR any text containing newline(s)
			const isPaste =
				inserted.length > 1 ||
				inserted.includes("\n") ||
				inserted.includes("\r");

			if (isPaste) {
				vscode.window.showInformationMessage("Detected paste, running analysis...");
				mainSidebarViewProvider.triggerBackgroundAnalysis();
				charSinceLastRun = 0;
				continue;
			}

			// --- NORMAL TYPING COUNT ---
			charSinceLastRun += inserted.length;

			if (charSinceLastRun >= 100) {
				vscode.window.showInformationMessage("Detected significant typing, running analysis...");
				mainSidebarViewProvider.triggerBackgroundAnalysis();
				charSinceLastRun = 0;
			}
		}
	});

	//api key setting command
	const setApiKey = vscode.commands.registerCommand('ermactually.setApiKey', async () => {
		const apiKey = await vscode.window.showInputBox({
			prompt: 'Enter your OpenAI API Key',
			ignoreFocusOut: true,
			password: true
		});

		if (apiKey) {
			await context.secrets.store('openaiApiKey', apiKey);
			vscode.window.showInformationMessage('OpenAI API Key saved successfully!');
		}
	});
	context.subscriptions.push(setApiKey);

	const openSettings = vscode.commands.registerCommand('ermactually.openSettings', () => {
		//changed:  MainSidebarViewProvider.createSettingsPanel(context, context.extensionUri);
		
		//SettingsPanelProvider.createSettingsPanel(context, context.extensionUri);
	});
	context.subscriptions.push(openSettings);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ermactually" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('ermactually.ErmActually', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const input = await vscode.window.showInputBox({prompt: "Type your name ma broda" });
		vscode.window.showInformationMessage(`wassup ${input} how ya doin`);
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
