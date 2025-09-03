import React from 'react';
import { MarkdownElement, ParsedMarkdown } from './types';
import { MarkdownParser } from './MarkdownParser';

export class MarkdownRenderer {
  /**
   * Render parsed markdown into React components
   */
  static render(parsedMarkdown: ParsedMarkdown): React.ReactNode[] {
    return parsedMarkdown.elements.map((element, index) => 
      this.renderElement(element, index)
    );
  }

  /**
   * Render a single markdown element
   */
  private static renderElement(element: MarkdownElement, key: number): React.ReactNode {
    switch (element.type) {
      case 'codeBlock':
        return (
          <pre key={`code-${key}`} className="markdown-code-block">
            <code className={`language-${element.language || 'text'}`}>
              {element.content as string}
            </code>
          </pre>
        );

      case 'paragraph':
        return (
          <p key={`line-${key}`} className="markdown-paragraph">
            {this.renderInlineElements(element.content as MarkdownElement[])}
          </p>
        );

      case 'header':
        const level = element.level || 1;
        const headerProps = {
          key: `header-${key}`,
          className: `markdown-header markdown-h${level}`
        };
        
        const headerContent = this.renderInlineElements(element.content as MarkdownElement[]);
        
        switch (level) {
          case 1:
            return <h1 {...headerProps}>{headerContent}</h1>;
          case 2:
            return <h2 {...headerProps}>{headerContent}</h2>;
          case 3:
            return <h3 {...headerProps}>{headerContent}</h3>;
          case 4:
            return <h4 {...headerProps}>{headerContent}</h4>;
          case 5:
            return <h5 {...headerProps}>{headerContent}</h5>;
          default:
            return <h6 {...headerProps}>{headerContent}</h6>;
        }

      case 'listItem':
        const isOrdered = element.isOrdered;
        return (
          <li key={`list-item-${key}`} className={isOrdered ? "markdown-ordered-list-item" : "markdown-unordered-list-item"}>
            {this.renderInlineElements(element.content as MarkdownElement[])}
          </li>
        );

      case 'blockquote':
        return (
          <blockquote key={`quote-${key}`} className="markdown-blockquote">
            {this.renderInlineElements(element.content as MarkdownElement[])}
          </blockquote>
        );

      case 'horizontalRule':
        return <hr key={`hr-${key}`} className="markdown-hr" />;

      default:
        return null;
    }
  }

  /**
   * Render inline markdown elements
   */
  private static renderInlineElements(elements: MarkdownElement[]): React.ReactNode[] {
    return elements.map((element, index) => {
      switch (element.type) {
        case 'text':
          return element.content as string;

        case 'bold':
          return (
            <strong key={`bold-${index}`} className="markdown-bold">
              {this.renderInlineElements(element.content as MarkdownElement[])}
            </strong>
          );

        case 'italic':
          return (
            <em key={`italic-${index}`} className="markdown-italic">
              {element.content as string}
            </em>
          );

        case 'inlineCode':
          return (
            <code key={`inline-code-${index}`} className="markdown-inline-code">
              {element.content as string}
            </code>
          );

        default:
          return element.content as string;
      }
    });
  }

  /**
   * Convenience method to parse and render markdown in one step
   */
  static parseAndRender(text: string): React.ReactNode[] {
    const parsed = MarkdownParser.parse(text);
    return this.render(parsed);
  }
}
