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
exports.MainSidebarViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const openai_1 = require("openai");
class MainSidebarViewProvider {
    _context;
    _extensionUri;
    static viewType = 'ermactually.mainSidebarView';
    _view;
    constructor(_context, _extensionUri) {
        this._context = _context;
        this._extensionUri = _extensionUri;
    }
    /** ----------------------------
     *  SECRET STORAGE + OPENAI CLIENT
     *  ---------------------------- */
    async getOpenAIClient() {
        const apiKey = await this._context.secrets.get('openaiApiKey');
        if (!apiKey) {
            vscode.window.showErrorMessage("OpenAI API Key not set. Run: 'ErmActually: Set OpenAI API Key'");
            return undefined;
        }
        return new openai_1.OpenAI({ apiKey });
    }
    /** ----------------------------
     *  PROCESS ACTIVE FILE
     *  ---------------------------- */
    async processActiveFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return "No active editor";
        }
        const document = editor.document;
        const client = await this.getOpenAIClient();
        if (!client) {
            return "Missing API key.";
        }
        const prompt = {
            initPrompt: "Analyze the following code and provide insights:",
            code: document.getText()
        };
        try {
            const response = await client.responses.create({
                model: "gpt-4o",
                input: prompt.initPrompt + "\n\n" + prompt.code
            });
            return response.output_text;
        }
        catch (err) {
            console.error(err);
            return "Error contacting OpenAI: " + String(err);
        }
    }
    /** ----------------------------
     *  WEBVIEW SETUP
     *  ---------------------------- */
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')]
        };
        webviewView.webview.html = this.getHtml(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.type === "processCode") {
                const result = await this.processActiveFile();
                webviewView.webview.postMessage({ type: "processedResult", result });
            }
        });
    }
    /** ----------------------------
     *  HTML
     *  ---------------------------- */
    getHtml(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "main.js"));
        const nonce = this.getNonce();
        return /*html*/ `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy"
                  content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src ${webview.cspSource}; connect-src https://api.openai.com;">
        </head>
        <body>
            <h2>ErmActually</h2>
            <button id="processCodeButton">Process Active File</button>
            <pre id="output"></pre>

            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
    }
    getNonce() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
}
exports.MainSidebarViewProvider = MainSidebarViewProvider;
//# sourceMappingURL=MainSidebarViewProvider.js.map