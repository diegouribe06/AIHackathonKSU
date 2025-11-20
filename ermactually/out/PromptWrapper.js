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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
const openai_1 = __importDefault(require("openai"));
const vscode = __importStar(require("vscode"));
class Agent {
    _context;
    openai;
    constructor(_context) {
        this._context = _context;
        this.getOpenAIClient().then(client => {
            if (client)
                this.openai = client;
        });
    }
    async getOpenAIClient() {
        const apiKey = await this._context.secrets.get("openaiApiKey");
        if (!apiKey) {
            vscode.window.showErrorMessage("OpenAI API Key not set. Run: 'ErmActually: Set OpenAI API Key'");
            return undefined;
        }
        return new openai_1.default({ apiKey });
    }
    async processActiveFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return [];
        const document = editor.document;
        const client = this.openai;
        if (!client)
            return [];
        //prompt was updated
        const prompt = {
            initPrompt: `
    You are a real-time security auditor. Periodically check the programmer's newly added or modified code. 
    Analyze only the code shown to you. Detect lines that could cause security vulnerabilities 
    (injection risks, unsafe API usage, hardcoded secrets, file permission issues, etc.).

    Output a JSON array only. Each element:
    {
    "line_numbers": "string | number | number[] | range (e.g., '12-18')",
    "issue_type": "string",
    "severity": "low | medium | high | critical",
    "description": "Short explanation",
    "recommendation": "Actionable safer alternative"
    }

    If no issues are found, output: []
    JSON only. Do NOT include code fences.
            `,
            code: document.getText()
        };
        try {
            const response = await client.responses.create({
                model: "gpt-4o",
                input: prompt.initPrompt + "\n\n" + prompt.code
            });
            if (!response)
                return [];
            let output = response.output_text.trim();
            // Remove Markdown code fences if present
            output = output.replace(/^```(?:json)?\s*/, '').replace(/```$/, '');
            try {
                const issues = JSON.parse(output);
                return issues;
            }
            catch (err) {
                console.error("Failed to parse OpenAI output as JSON:", err, output);
                return [];
            }
        }
        catch (err) {
            console.error(err);
            return [];
        }
    }
}
exports.Agent = Agent;
//# sourceMappingURL=PromptWrapper.js.map