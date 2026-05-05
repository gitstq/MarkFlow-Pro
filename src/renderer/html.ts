/**
 * MarkFlow-Pro HTML Renderer
 *
 * Converts an evaluated AST into clean, semantic HTML5 output.
 * Supports all standard Markdown elements plus custom function outputs.
 * Integrates with highlight.js for code syntax highlighting.
 */

import {
  MFASTNode,
  MFDocument,
  MFHeading,
  MFParagraph,
  MFText,
  MFBold,
  MFItalic,
  MFCode,
  MFCodeBlock,
  MFList,
  MFListItem,
  MFTable,
  MFTableCell,
  MFImage,
  MFLink,
  MFBlockquote,
  MFHR,
  MFHTML,
  MFStrikethrough,
  MFMathInline,
  MFMathBlock,
  MFToc,
  MFPageBreak,
  MFComment,
  MFSoftBreak,
} from '../parser/types';
import { MFTheme, applyTheme } from './themes';

/** Options for HTML rendering */
export interface RenderHTMLOptions {
  /** Theme to apply */
  theme?: MFTheme;
  /** Whether to include highlight.js CSS */
  includeHighlightJS?: boolean;
  /** Custom CSS to include */
  customCSS?: string;
  /** Whether to generate a full HTML document (with <html>, <head>, <body>) */
  fullDocument?: boolean;
  /** Document title */
  title?: string;
}

/** HTML Renderer class */
export class HTMLRenderer {
  private options: RenderHTMLOptions;
  private headings: Array<{ level: number; text: string; id: string }>;

  constructor(options: RenderHTMLOptions = {}) {
    this.options = {
      includeHighlightJS: true,
      fullDocument: false,
      ...options,
    };
    this.headings = [];
  }

  /**
   * Render a document AST to HTML.
   *
   * @param ast - The evaluated document AST
   * @returns HTML string
   */
  render(ast: MFDocument): string {
    this.headings = [];
    const bodyContent = this.renderNodes(ast.children);
    const themeCSS = this.options.theme ? applyTheme(this.options.theme) : '';

    if (this.options.fullDocument) {
      return this.renderFullDocument(bodyContent, themeCSS);
    }

    return bodyContent;
  }

  /**
   * Render a full HTML document with doctype, head, and body.
   */
  private renderFullDocument(bodyContent: string, themeCSS: string): string {
    const title = this.options.title || 'MarkFlow-Pro Document';
    const highlightCSS = this.options.includeHighlightJS
      ? `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">\n<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>\n<script>hljs.highlightAll();</script>`
      : '';

    const customCSS = this.options.customCSS ? `<style>${this.options.customCSS}</style>` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    ${themeCSS}
    body {
      font-family: var(--mf-font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      line-height: 1.6;
      color: var(--mf-text-color, #1a1a1a);
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    pre {
      background-color: var(--mf-code-bg, #f6f8fa);
      border-radius: 6px;
      padding: 1rem;
      overflow-x: auto;
    }
    code {
      font-family: var(--mf-font-code, 'Fira Code', 'Consolas', monospace);
      font-size: 0.9em;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
    }
    th, td {
      border: 1px solid var(--mf-border-color, #e0e0e0);
      padding: 0.5rem 1rem;
      text-align: left;
    }
    th {
      background-color: var(--mf-table-header-bg, #f6f8fa);
      font-weight: 600;
    }
    blockquote {
      border-left: 4px solid var(--mf-border-color, #e0e0e0);
      padding-left: 1rem;
      margin: 1rem 0;
      color: var(--mf-text-secondary, #6b7280);
    }
    img {
      max-width: 100%;
      height: auto;
    }
    a {
      color: var(--mf-link-color, #2563eb);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    hr {
      border: none;
      border-top: 1px solid var(--mf-border-color, #e0e0e0);
      margin: 2rem 0;
    }
    .mf-toc {
      background-color: var(--mf-toc-bg, #f9fafb);
      border: 1px solid var(--mf-border-color, #e0e0e0);
      border-radius: 8px;
      padding: 1rem 1.5rem;
      margin: 1rem 0;
    }
    .mf-toc h3 {
      margin-top: 0;
    }
    .mf-toc ul {
      list-style-type: none;
      padding-left: 0;
    }
    .mf-toc li {
      margin: 0.25rem 0;
    }
    .mf-toc a {
      color: var(--mf-text-color, #1a1a1a);
    }
    .mf-math {
      text-align: center;
      margin: 1rem 0;
      font-family: 'Latin Modern Math', 'STIX Two Math', serif;
      font-size: 1.1em;
    }
    .mf-tab-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--mf-border-color, #e0e0e0);
      background: var(--mf-tab-bg, #f9fafb);
      cursor: pointer;
      border-radius: 6px 6px 0 0;
    }
    .mf-tab-btn.active {
      background: white;
      border-bottom: 2px solid var(--mf-link-color, #2563eb);
      font-weight: 600;
    }
    .mf-tab-panel {
      padding: 1rem;
      border: 1px solid var(--mf-border-color, #e0e0e0);
      border-top: none;
    }
  </style>
  ${customCSS}
  ${highlightCSS}
  <script>
    function mfSwitchTab(tabGroupId, tabId) {
      const group = document.getElementById(tabGroupId);
      if (!group) return;
      group.querySelectorAll('.mf-tab-btn').forEach(btn => btn.classList.remove('active'));
      group.querySelectorAll('.mf-tab-panel').forEach(panel => panel.style.display = 'none');
      const activeBtn = group.querySelector('[data-tab="' + tabId + '"]');
      const activePanel = document.getElementById(tabId);
      if (activeBtn) activeBtn.classList.add('active');
      if (activePanel) activePanel.style.display = 'block';
    }
  </script>
</head>
<body>
${bodyContent}
</body>
</html>`;
  }

  /**
   * Render a list of AST nodes to HTML.
   */
  renderNodes(nodes: MFASTNode[]): string {
    return nodes.map((node) => this.renderNode(node)).join('\n');
  }

  /**
   * Render a single AST node to HTML.
   */
  renderNode(node: MFASTNode): string {
    switch (node.type) {
      case 'Document':
        return this.render(node as MFDocument);

      case 'Heading':
        return this.renderHeading(node as MFHeading);

      case 'Paragraph':
        return this.renderParagraph(node as MFParagraph);

      case 'Text':
        return this.renderText(node as MFText);

      case 'Bold':
        return this.renderBold(node as MFBold);

      case 'Italic':
        return this.renderItalic(node as MFItalic);

      case 'Code':
        return this.renderCode(node as MFCode);

      case 'CodeBlock':
        return this.renderCodeBlock(node as MFCodeBlock);

      case 'List':
        return this.renderList(node as MFList);

      case 'ListItem':
        return this.renderListItem(node as MFListItem);

      case 'Table':
        return this.renderTable(node as MFTable);

      case 'TableCell':
        return this.renderTableCell(node as MFTableCell);

      case 'Image':
        return this.renderImage(node as MFImage);

      case 'Link':
        return this.renderLink(node as MFLink);

      case 'Blockquote':
        return this.renderBlockquote(node as MFBlockquote);

      case 'HR':
        return this.renderHR();

      case 'HTML':
        return this.renderHTML(node as MFHTML);

      case 'Strikethrough':
        return this.renderStrikethrough(node as MFStrikethrough);

      case 'MathInline':
        return this.renderMathInline(node as MFMathInline);

      case 'MathBlock':
        return this.renderMathBlock(node as MFMathBlock);

      case 'Toc':
        return this.renderToc(node as MFToc);

      case 'PageBreak':
        return this.renderPageBreak();

      case 'Comment':
        return '';

      case 'SoftBreak':
        return '<br>\n';

      case 'FunctionCall':
      case 'VariableDef':
      case 'VariableRef':
      case 'Conditional':
      case 'Loop':
      case 'Callout':
      case 'Footnote':
      case 'FootnoteRef':
        // These should be resolved by the evaluator before rendering.
        // If they reach here, render as HTML passthrough.
        return '';

      default:
        return '';
    }
  }

  private renderHeading(node: MFHeading): string {
    const id = generateHeadingId(node.rawText || this.extractText(node.children));
    this.headings.push({ level: node.level, text: node.rawText || this.extractText(node.children), id });
    const content = this.renderNodes(node.children);
    return `<h${node.level} id="${escapeHtml(id)}">${content}</h${node.level}>`;
  }

  private renderParagraph(node: MFParagraph): string {
    const content = this.renderNodes(node.children);
    return `<p>${content}</p>`;
  }

  private renderText(node: MFText): string {
    return escapeHtml(node.value);
  }

  private renderBold(node: MFBold): string {
    const content = this.renderNodes(node.children);
    return `<strong>${content}</strong>`;
  }

  private renderItalic(node: MFItalic): string {
    const content = this.renderNodes(node.children);
    return `<em>${content}</em>`;
  }

  private renderCode(node: MFCode): string {
    return `<code>${escapeHtml(node.value)}</code>`;
  }

  private renderCodeBlock(node: MFCodeBlock): string {
    const lang = node.language ? ` class="language-${escapeHtml(node.language)}"` : '';
    const escaped = escapeHtml(node.value);
    return `<pre><code${lang}>${escaped}</code></pre>`;
  }

  private renderList(node: MFList): string {
    const tag = node.ordered ? 'ol' : 'ul';
    const content = node.children.map((item) => this.renderListItem(item)).join('\n');
    return `<${tag}>${content}</${tag}>`;
  }

  private renderListItem(node: MFListItem): string {
    const content = this.renderNodes(node.children);
    return `<li>${content}</li>`;
  }

  private renderTable(node: MFTable): string {
    const headerCells = node.header.map((cell, idx) => {
      const align = node.align[idx] ? ` style="text-align: ${node.align[idx]};"` : '';
      return `<th${align}>${this.renderNodes(cell.children)}</th>`;
    }).join('');

    const bodyRows = node.rows.map((row) => {
      const cells = row.map((cell, idx) => {
        const align = node.align[idx] ? ` style="text-align: ${node.align[idx]};"` : '';
        return `<td${align}>${this.renderNodes(cell.children)}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('\n');

    return `<table>\n<thead><tr>${headerCells}</tr></thead>\n<tbody>${bodyRows}</tbody>\n</table>`;
  }

  private renderTableCell(node: MFTableCell): string {
    return this.renderNodes(node.children);
  }

  private renderImage(node: MFImage): string {
    const title = node.title ? ` title="${escapeHtml(node.title)}"` : '';
    return `<img src="${escapeHtml(node.src)}" alt="${escapeHtml(node.alt)}"${title}>`;
  }

  private renderLink(node: MFLink): string {
    const title = node.title ? ` title="${escapeHtml(node.title)}"` : '';
    const content = this.renderNodes(node.children);
    return `<a href="${escapeHtml(node.href)}"${title}>${content}</a>`;
  }

  private renderBlockquote(node: MFBlockquote): string {
    const content = this.renderNodes(node.children);
    return `<blockquote>${content}</blockquote>`;
  }

  private renderHR(): string {
    return '<hr>';
  }

  private renderHTML(node: MFHTML): string {
    return node.value;
  }

  private renderStrikethrough(node: MFStrikethrough): string {
    const content = this.renderNodes(node.children);
    return `<del>${content}</del>`;
  }

  private renderMathInline(node: MFMathInline): string {
    return `<span class="mf-math-inline">\\(${escapeHtml(node.expression)}\\)</span>`;
  }

  private renderMathBlock(node: MFMathBlock): string {
    return `<div class="mf-math">\\[${escapeHtml(node.expression)}\\]</div>`;
  }

  private renderToc(node: MFToc): string {
    const maxDepth = node.maxDepth || 3;
    const filteredHeadings = this.headings.filter((h) => h.level <= maxDepth);

    if (filteredHeadings.length === 0) {
      return `<div class="mf-toc"><h3>Table of Contents</h3><p><em>No headings found.</em></p></div>`;
    }

    const items = filteredHeadings.map((h) => {
      const indent = (h.level - 1) * 1.5;
      return `<li style="padding-left: ${indent}rem;"><a href="#${escapeHtml(h.id)}">${escapeHtml(h.text)}</a></li>`;
    }).join('\n');

    return `<div class="mf-toc"><h3>Table of Contents</h3><ul>${items}</ul></div>`;
  }

  private renderPageBreak(): string {
    return `<div class="mf-page-break" style="page-break-after: always; border-bottom: 2px dashed var(--mf-border-color, #e0e0e0); margin: 2rem 0;"></div>`;
  }

  /** Extract plain text content from a list of nodes */
  private extractText(nodes: MFASTNode[]): string {
    return nodes
      .map((node) => {
        if (node.type === 'Text') return (node as MFText).value;
        if ('children' in node) return this.extractText((node as any).children);
        return '';
      })
      .join('');
  }
}

/** Escape HTML special characters */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Generate a URL-safe heading ID from text */
function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Render a MarkFlow-Pro AST document to HTML.
 *
 * @param ast - The evaluated document AST
 * @param options - Rendering options
 * @returns HTML string
 */
export function renderHTML(ast: MFDocument, options: RenderHTMLOptions = {}): string {
  const renderer = new HTMLRenderer(options);
  return renderer.render(ast);
}
