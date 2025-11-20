import OpenAI from "openai";
import * as vscode from "vscode";

type Answer = {
line_numbers: string | number | number[] | vscode.Range,
  issue_type: string,
  severity: "low" | "medium" | "high" | "critical",
  description: string,
  recommendation: string
}
type Prompt = {
    initPrompt: string;
    code: string;
}

export class Agent{
    openai?: OpenAI;
    constructor(private readonly _context: vscode.ExtensionContext) {
        // initialize the OpenAI client asynchronously and store it when ready
        this.getOpenAIClient().then(client => {
            if (client) {
                this.openai = client;
            }
        });
    }

    async getOpenAIClient(): Promise<OpenAI | undefined> {
        const apiKey = await this._context.secrets.get('openaiApiKey');

        if (!apiKey) {
            vscode.window.showErrorMessage(
                "OpenAI API Key not set. Run: 'ErmActually: Set OpenAI API Key'"
            );
            return undefined;
        }

        return new OpenAI({ apiKey });
    }
    public async processActiveFile(): Promise<string> {
    
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return "No active editor";
            }
    
            const document = editor.document;
    
            const client = this.openai;
            if (!client) {
                return "Missing API key.";
            }
    
            const prompt: Prompt = {
                initPrompt: "You are a real-time security auditor. Periodically check the programmer's newly added or modified code. Analyze only the code shown to you.Your task is to detect any lines that could cause present or future security vulnerabilities, including (but not limited to): injection risks, insecure input handling, unsafe API usage, insecure cryptography, hardcoded secrets, file permission issues, memory safety issues, deserialization problems, or potential privilege escalation.For every vulnerability you detect, output a JSON array where each element describes one issue. Each element must follow this exact structure:{\"line_numbers\": \"string | number | number[] | range (e.g., '12-18')\",\"issue_type\": \"string\",\"severity\": \"low | medium | high | critical\",\"description\": \"Short explanation of why this line may create a future vulnerability.\",\"recommendation\": \"Actionable safer alternative.\"}If no issues are found, output: []You must output JSON only.",
                code: document.getText()
            };
    
            try {
                const response = await this.openai?.responses.create({
                    model: "gpt-4o",
                    input: prompt.initPrompt + "\n\n" + prompt.code
                });
                if(!response){
                    return "No response from OpenAI.";
                }
                return response.output_text;
            } catch (err) {
                console.error(err);
                return "Error contacting OpenAI: " + String(err);
            }
        }
}
