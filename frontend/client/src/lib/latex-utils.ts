/**
 * Escapes special LaTeX characters in a string.
 */
export function escapeLatex(text: string): string {
    if (!text) return "";
    return text
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/\$/g, '\\$')
        .replace(/&/g, '\\&')
        .replace(/#/g, '\\#')
        .replace(/\^/g, '\\textasciicircum{}')
        .replace(/_/g, '\\_')
        .replace(/~/g, '\\textasciitilde{}')
        .replace(/%/g, '\\%');
}

/**
 * Converts basic Markdown to LaTeX.
 * Handles bold, italic, and preserves math blocks (assuming they are already in LaTeX format like $...$ or $$...$$).
 * 
 * Note: This is a simplified converter. Complex markdown might need a more robust parser.
 */
export function markdownToLatex(text: string): string {
    if (!text) return "";

    // 1. Protect Math blocks (so we don't escape them)
    const mathBlocks: string[] = [];
    let protectedText = text.replace(/(\$\$[\s\S]*?\$\$|\$[^$]*?\$)/g, (match) => {
        mathBlocks.push(match);
        return `__MATH_BLOCK_${mathBlocks.length - 1}__`;
    });

    // 2. Escape normal text
    protectedText = escapeLatex(protectedText);

    // 3. Convert Markdown formatting
    // Bold (**text**)
    protectedText = protectedText.replace(/\*\*(.*?)\*\*/g, '\\textbf{$1}');
    // Italic (*text*)
    protectedText = protectedText.replace(/\*(.*?)\*/g, '\\textit{$1}');
    // Newlines to \\ 
    protectedText = protectedText.replace(/\n/g, ' \\\\ \n');

    // 4. Restore Math blocks
    // We assume the math inside $...$ is already valid LaTeX math.
    // We strip the $ delimiters because we might want to wrap them differently, 
    // but usually keeping them is fine for standard LaTeX if using 'amsmath'.
    // However, $$...$$ usually maps to \[ ... \] in LaTeX documents for better spacing.

    return protectedText.replace(/__MATH_BLOCK_(\d+)__/g, (_, index) => {
        let block = mathBlocks[parseInt(index)];
        // Convert $$...$$ to \[ ... \]
        if (block.startsWith('$$')) {
            return '\\[' + block.slice(2, -2) + '\\]';
        }
        // Keep $...$ as is
        return block;
    });
}
