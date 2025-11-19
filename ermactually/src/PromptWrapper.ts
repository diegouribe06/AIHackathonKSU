import OpenAI from "openai";
import { Range } from "vscode";

type answer = {
    line_numbers: string | number | number[] | Range,
  issue_type: string,
  severity: "low" | "medium" | "high" | "critical",
  description: string,
  recommendation: string
}

class Prompt{

    static openai = new OpenAI(); 

    initPrompt : string;
    code: string;

    constructor(code:string){
        this.initPrompt =  "You are a real-time security auditor. Periodically check the programmer's newly added or modified code. Analyze only the code shown to you.Your task is to detect any lines that could cause present or future security vulnerabilities, including (but not limited to): injection risks, insecure input handling, unsafe API usage, insecure cryptography, hardcoded secrets, file permission issues, memory safety issues, deserialization problems, or potential privilege escalation.For every vulnerability you detect, output a JSON array where each element describes one issue. Each element must follow this exact structure:{\"line_numbers\": \"string | number | number[] | range (e.g., '12-18')\",\"issue_type\": \"string\",\"severity\": \"low | medium | high | critical\",\"description\": \"Short explanation of why this line may create a future vulnerability.\",\"recommendation\": \"Actionable safer alternative.\"}If no issues are found, output: []You must output JSON only.";
        this.code = code;
    }
    
    askQuestion(): answer{
        const gptAnswer : answer = {
            line_numbers: 10, 
            issue_type: "Issue Test", 
            severity: "low", 
            description: "short explanation", 
            recommendation: "Action"};

        return gptAnswer;
    }
}
