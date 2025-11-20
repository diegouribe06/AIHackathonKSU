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
