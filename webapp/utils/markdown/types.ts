export interface MarkdownElement {
  type: string;
  content: string | MarkdownElement[];
  language?: string;
  level?: number;
  isOrdered?: boolean;
}

export interface ParsedMarkdown {
  elements: MarkdownElement[];
}

export interface InlineMarkdownElement {
  type: 'text' | 'bold' | 'italic' | 'inlineCode';
  content: string;
}
