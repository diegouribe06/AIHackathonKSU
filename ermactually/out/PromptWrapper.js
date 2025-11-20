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
        // initialize the OpenAI client asynchronously and store it when ready
        this.getOpenAIClient().then(client => {
            if (client) {
                this.openai = client;
            }
        });
    }
    async getOpenAIClient() {
        const apiKey = await this._context.secrets.get('openaiApiKey');
        if (!apiKey) {
            vscode.window.showErrorMessage("OpenAI API Key not set. Run: 'ErmActually: Set OpenAI API Key'");
            return undefined;
        }
        return new openai_1.default({ apiKey });
    }
    async processActiveFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return "No active editor";
        }
        const document = editor.document;
        const client = this.openai;
        if (!client) {
            return "Missing API key.";
        }
        const prompt = {
            initPrompt: "You are a real-time security auditor. Periodically check the programmer's newly added or modified code. Analyze only the code shown to you.Your task is to detect any lines that could cause present or future security vulnerabilities, including (but not limited to): injection risks, insecure input handling, unsafe API usage, insecure cryptography, hardcoded secrets, file permission issues, memory safety issues, deserialization problems, or potential privilege escalation.For every vulnerability you detect, output a JSON array where each element describes one issue. Each element must follow this exact structure:{\"line_numbers\": \"string | number | number[] | range (e.g., '12-18')\",\"issue_type\": \"string\",\"severity\": \"low | medium | high | critical\",\"description\": \"Short explanation of why this line may create a future vulnerability.\",\"recommendation\": \"Actionable safer alternative.\"}If no issues are found, output: []You must output JSON only.",
            code: document.getText()
        };
        try {
            const response = await this.openai?.responses.create({
                model: "gpt-4o",
                input: prompt.initPrompt + "\n\n" + prompt.code
            });
            if (!response) {
                return "No response from OpenAI.";
            }
            return response.output_text;
        }
        catch (err) {
            console.error(err);
            return "Error contacting OpenAI: " + String(err);
        }
    }
}
exports.Agent = Agent;
//# sourceMappingURL=PromptWrapper.js.map