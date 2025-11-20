import OpenAI from "openai";
import * as vscode from "vscode";

export type Answer = {
    line_numbers: string | number | number[],
    issue_type: string,
    severity: "low" | "medium" | "high" | "critical",
    description: string,
    recommendation: string
};

type Prompt = {
    initPrompt: string;
    code: string;
};

export class Agent {
    openai?: OpenAI;

    constructor(private readonly _context: vscode.ExtensionContext) {
        this.getOpenAIClient().then(client => {
            if (client) this.openai = client;
        });
    }

    async getOpenAIClient(): Promise<OpenAI | undefined> {
        const apiKey = await this._context.secrets.get("openaiApiKey");
        if (!apiKey) {
            vscode.window.showErrorMessage(
                "OpenAI API Key not set. Run: 'ErmActually: Set OpenAI API Key'"
            );
            return undefined;
        }
        return new OpenAI({ apiKey });
    }

    public async processActiveFile(): Promise<Answer[]> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return [];

        const document = editor.document;
        const client = this.openai;
        if (!client) return [];

        //prompt was updated
        const prompt: Prompt = {
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

            if (!response) return [];

            let output = response.output_text.trim();

            // Remove Markdown code fences if present
            output = output.replace(/^```(?:json)?\s*/, '').replace(/```$/, '');

            try {
                const issues: Answer[] = JSON.parse(output);
                return issues;
            } catch (err) {
                console.error("Failed to parse OpenAI output as JSON:", err, output);
                return [];
            }

        } catch (err) {
            console.error(err);
            return [];
        }
    }
}
