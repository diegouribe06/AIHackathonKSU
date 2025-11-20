"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const MainSidebarViewProvider_1 = require("./MainSidebarViewProvider");
const SettingsPanelProvider_1 = require("./SettingsPanelProvider");
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    const mainSidebarViewProvider = new MainSidebarViewProvider_1.MainSidebarViewProvider(context, context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(MainSidebarViewProvider_1.MainSidebarViewProvider.viewType, mainSidebarViewProvider));
    //Character counting and paste monitoring
    let charSinceLastRun = 0;
    // Matches ONLY whitespace and newlines
    const onlyWhitespaceOrNewline = /^[\s\n\r]*$/;
    vscode.workspace.onDidChangeTextDocument((event) => {
        const active = vscode.window.activeTextEditor;
        if (!active || event.document !== active.document)
            return;
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
            const isPaste = inserted.length > 1 ||
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
        SettingsPanelProvider_1.SettingsPanelProvider.createSettingsPanel(context, context.extensionUri);
    });
    context.subscriptions.push(openSettings);
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "ermactually" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand('ermactually.ErmActually', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World from ErmActually!');
    });
    context.subscriptions.push(disposable);
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map