import { MarkdownElement, ParsedMarkdown, InlineMarkdownElement } from './types';

export class MarkdownParser {
  /**
   * Parse markdown text into structured elements
   */
  static parse(text: string): ParsedMarkdown {
    const lines = text.split('\n');
    const elements: MarkdownElement[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          elements.push({
            type: 'codeBlock',
            content: codeBlockContent.join('\n'),
            language: codeBlockLanguage
          });
          inCodeBlock = false;
          codeBlockContent = [];
          codeBlockLanguage = '';
        } else {
          // Start of code block
          codeBlockLanguage = line.slice(3).trim();
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Handle inline code
      if (line.includes('`')) {
        const parts = line.split('`');
        const processedLine: MarkdownElement[] = [];
        
        for (let j = 0; j < parts.length; j++) {
          if (j % 2 === 0) {
            // Regular text
            if (parts[j]) {
              processedLine.push(...this.parseInlineMarkdown(parts[j]));
            }
          } else {
            // Inline code
            processedLine.push({
              type: 'inlineCode',
              content: parts[j]
            });
          }
        }
        
        elements.push({
          type: 'paragraph',
          content: processedLine
        });
        continue;
      }

      // Handle headers
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s*/, '');
        
        elements.push({
          type: 'header',
          content: this.parseInlineMarkdown(text),
          level: Math.min(level, 6)
        });
        continue;
      }

      // Handle lists
      if (line.match(/^\s*[-*+]\s/) || line.match(/^\s*\d+\.\s/)) {
        const isOrdered = !!line.match(/^\s*\d+\.\s/);
        const text = line.replace(/^\s+/, '');
        
        elements.push({
          type: 'listItem',
          content: this.parseInlineMarkdown(text),
          isOrdered
        });
        continue;
      }

      // Handle blockquotes
      if (line.startsWith('>')) {
        const text = line.replace(/^>\s*/, '');
        elements.push({
          type: 'blockquote',
          content: this.parseInlineMarkdown(text)
        });
        continue;
      }

      // Handle horizontal rules
      if (line.match(/^[-*_]{3,}$/)) {
        elements.push({
          type: 'horizontalRule',
          content: ''
        });
        continue;
      }

      // Regular paragraph
      if (line.trim()) {
        elements.push({
          type: 'paragraph',
          content: this.parseInlineMarkdown(line)
        });
      }
    }

    return { elements };
  }

  /**
   * Parse inline markdown (bold, italic, inline code)
   */
  static parseInlineMarkdown(text: string): MarkdownElement[] {
    const elements: MarkdownElement[] = [];
    let currentText = text;
    let keyCounter = 0;

    // Handle bold text (**text** or __text__)
    const boldRegex = /(\*\*|__)(.*?)\1/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(currentText)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        elements.push({
          type: 'text',
          content: currentText.slice(lastIndex, match.index)
        });
      }
      
      // Add bold text
      elements.push({
        type: 'bold',
        content: this.parseInlineMarkdown(match[2])
      });
      
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < currentText.length) {
      const remainingText = currentText.slice(lastIndex);
      
      // Handle italic text (*text* or _text_)
      const italicRegex = /(\*|_)(.*?)\1/g;
      let italicLastIndex = 0;
      let italicMatch;
      const italicElements: MarkdownElement[] = [];

      while ((italicMatch = italicRegex.exec(remainingText)) !== null) {
        // Add text before the italic match
        if (italicMatch.index > italicLastIndex) {
          italicElements.push({
            type: 'text',
            content: remainingText.slice(italicLastIndex, italicMatch.index)
          });
        }
        
        // Add italic text
        italicElements.push({
          type: 'italic',
          content: italicMatch[2]
        });
        
        italicLastIndex = italicMatch.index + italicMatch[0].length;
      }

      // Add remaining text after italic processing
      if (italicLastIndex < remainingText.length) {
        italicElements.push({
          type: 'text',
          content: remainingText.slice(italicLastIndex)
        });
      }

      elements.push(...italicElements);
    }

    return elements.length > 0 ? elements : [{ type: 'text', content: text }];
  }
}
