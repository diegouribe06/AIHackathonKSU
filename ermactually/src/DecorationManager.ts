import * as vscode from 'vscode';
import { Answer } from './PromptWrapper';

export class DecorationManager {
    private criticalDecoration: vscode.TextEditorDecorationType;
    private highDecoration: vscode.TextEditorDecorationType;
    private mediumDecoration: vscode.TextEditorDecorationType;
    private lowDecoration: vscode.TextEditorDecorationType;
    private currentDecorations: Map<string, vscode.Range[]> = new Map();

    constructor(private context: vscode.ExtensionContext) {
        // Get colors from settings or use defaults
        const settings = context.workspaceState.get('ermactually.settings', {
            criticalColor: '#ff4500',
            highColor: '#ff8c00',
            mediumColor: '#ffd700',
            lowColor: '#32cd32'
        });

        this.criticalDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: this.hexToRgba(settings.criticalColor || '#ff4500', 0.2),
            borderWidth: '0 0 0 3px',
            borderStyle: 'solid',
            borderColor: settings.criticalColor || '#ff4500'
        });

        this.highDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: this.hexToRgba(settings.highColor || '#ff8c00', 0.2),
            borderWidth: '0 0 0 3px',
            borderStyle: 'solid',
            borderColor: settings.highColor || '#ff8c00'
        });

        this.mediumDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: this.hexToRgba(settings.mediumColor || '#ffd700', 0.2),
            borderWidth: '0 0 0 3px',
            borderStyle: 'solid',
            borderColor: settings.mediumColor || '#ffd700'
        });

        this.lowDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: this.hexToRgba(settings.lowColor || '#32cd32', 0.2),
            borderWidth: '0 0 0 3px',
            borderStyle: 'solid',
            borderColor: settings.lowColor || '#32cd32'
        });
    }

    private hexToRgba(hex: string, alpha: number): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    private parseLineNumbers(lineNumbers: string | number | number[]): number[] {
        if (typeof lineNumbers === 'number') {
            return [lineNumbers - 1]; // Convert to 0-based
        }
        if (Array.isArray(lineNumbers)) {
            return lineNumbers.map(n => (typeof n === 'number' ? n : parseInt(String(n))) - 1);
        }
        // Handle string ranges like "12-18" or single numbers
        const str = lineNumbers.toString();
        if (str.includes('-')) {
            const [start, end] = str.split('-').map(n => parseInt(n.trim()) - 1);
            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        }
        return [parseInt(str) - 1];
    }

    public updateDecorations(issues: Answer[]) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        // Clear all existing decorations first
        editor.setDecorations(this.criticalDecoration, []);
        editor.setDecorations(this.highDecoration, []);
        editor.setDecorations(this.mediumDecoration, []);
        editor.setDecorations(this.lowDecoration, []);

        // If no issues, decorations are already cleared
        if (!issues || issues.length === 0) {
            this.currentDecorations.clear();
            return;
        }

        // Group issues by severity
        const ranges: { critical: vscode.Range[], high: vscode.Range[], medium: vscode.Range[], low: vscode.Range[] } = {
            critical: [],
            high: [],
            medium: [],
            low: []
        };

        issues.forEach(issue => {
            const lineNums = this.parseLineNumbers(issue.line_numbers);
            lineNums.forEach(lineNum => {
                if (lineNum >= 0 && lineNum < editor.document.lineCount) {
                    const line = editor.document.lineAt(lineNum);
                    const range = new vscode.Range(line.range.start, line.range.end);
                    ranges[issue.severity].push(range);
                }
            });
        });

        // Apply decorations
        if (ranges.critical.length > 0) editor.setDecorations(this.criticalDecoration, ranges.critical);
        if (ranges.high.length > 0) editor.setDecorations(this.highDecoration, ranges.high);
        if (ranges.medium.length > 0) editor.setDecorations(this.mediumDecoration, ranges.medium);
        if (ranges.low.length > 0) editor.setDecorations(this.lowDecoration, ranges.low);

        // Store current decorations
        this.currentDecorations.set('critical', ranges.critical);
        this.currentDecorations.set('high', ranges.high);
        this.currentDecorations.set('medium', ranges.medium);
        this.currentDecorations.set('low', ranges.low);
    }

    public updateColors() {
        // Dispose old decorations
        this.dispose();
        
        // Recreate with new colors
        const settings = this.context.workspaceState.get('ermactually.settings', {
            criticalColor: '#ff4500',
            highColor: '#ff8c00',
            mediumColor: '#ffd700',
            lowColor: '#32cd32'
        });

        this.criticalDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: this.hexToRgba(settings.criticalColor || '#ff4500', 0.2),
            borderWidth: '0 0 0 3px',
            borderStyle: 'solid',
            borderColor: settings.criticalColor || '#ff4500'
        });

        this.highDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: this.hexToRgba(settings.highColor || '#ff8c00', 0.2),
            borderWidth: '0 0 0 3px',
            borderStyle: 'solid',
            borderColor: settings.highColor || '#ff8c00'
        });

        this.mediumDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: this.hexToRgba(settings.mediumColor || '#ffd700', 0.2),
            borderWidth: '0 0 0 3px',
            borderStyle: 'solid',
            borderColor: settings.mediumColor || '#ffd700'
        });

        this.lowDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: this.hexToRgba(settings.lowColor || '#32cd32', 0.2),
            borderWidth: '0 0 0 3px',
            borderStyle: 'solid',
            borderColor: settings.lowColor || '#32cd32'
        });

        // Reapply current decorations with new colors
        const editor = vscode.window.activeTextEditor;
        if (editor && this.currentDecorations.size > 0) {
            editor.setDecorations(this.criticalDecoration, this.currentDecorations.get('critical') || []);
            editor.setDecorations(this.highDecoration, this.currentDecorations.get('high') || []);
            editor.setDecorations(this.mediumDecoration, this.currentDecorations.get('medium') || []);
            editor.setDecorations(this.lowDecoration, this.currentDecorations.get('low') || []);
        }
    }

    public clearDecorations() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        editor.setDecorations(this.criticalDecoration, []);
        editor.setDecorations(this.highDecoration, []);
        editor.setDecorations(this.mediumDecoration, []);
        editor.setDecorations(this.lowDecoration, []);
        this.currentDecorations.clear();
    }

    public dispose() {
        this.criticalDecoration.dispose();
        this.highDecoration.dispose();
        this.mediumDecoration.dispose();
        this.lowDecoration.dispose();
    }
}

