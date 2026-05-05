/**
 * MarkFlow-Pro PDF Renderer
 *
 * Generates PDF output from an evaluated AST using an HTML-to-PDF approach.
 * The renderer first converts the AST to HTML, then wraps it in a
 * print-optimized HTML document suitable for PDF generation.
 */

import { MFDocument } from '../parser/types';
import { renderHTML, RenderHTMLOptions } from './html';
import { MFTheme, applyTheme } from './themes';

/** Options for PDF rendering */
export interface RenderPDFOptions extends RenderHTMLOptions {
  /** Page size: 'A4', 'Letter', 'A3' */
  pageSize?: 'A4' | 'Letter' | 'A3';
  /** Page orientation: 'portrait' or 'landscape' */
  orientation?: 'portrait' | 'landscape';
  /** Page margins in millimeters */
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  /** Header text */
  header?: string;
  /** Footer text */
  footer?: string;
  /** Output file path */
  outputPath?: string;
}

/** Page size dimensions in millimeters */
const PAGE_SIZES: Record<string, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  Letter: { width: 216, height: 279 },
  A3: { width: 297, height: 420 },
};

/** PDF Renderer class */
export class PDFRenderer {
  private options: RenderPDFOptions;

  constructor(options: RenderPDFOptions = {}) {
    this.options = {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      ...options,
    };
  }

  /**
   * Render a document AST to a print-optimized HTML string for PDF generation.
   *
   * @param ast - The evaluated document AST
   * @returns Print-optimized HTML string
   */
  render(ast: MFDocument): string {
    const htmlContent = renderHTML(ast, {
      ...this.options,
      fullDocument: false,
    });

    const themeCSS = this.options.theme ? applyTheme(this.options.theme) : '';
    const pageSize = PAGE_SIZES[this.options.pageSize || 'A4'] || PAGE_SIZES.A4;
    const margins = this.options.margins || { top: 20, right: 20, bottom: 20, left: 20 };

    const isLandscape = this.options.orientation === 'landscape';
    const pageWidth = isLandscape ? pageSize.height : pageSize.width;
    const pageHeight = isLandscape ? pageSize.width : pageSize.height;

    const contentWidth = pageWidth - (margins.left || 20) - (margins.right || 20);

    const headerHTML = this.options.header
      ? `<div class="pdf-header">${escapeHtml(this.options.header)}</div>`
      : '';
    const footerHTML = this.options.footer
      ? `<div class="pdf-footer">${escapeHtml(this.options.footer)}</div>`
      : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(this.options.title || 'MarkFlow-Pro Document')}</title>
  <style>
    @page {
      size: ${this.options.pageSize || 'A4'} ${this.options.orientation || 'portrait'};
      margin: ${margins.top || 20}mm ${margins.right || 20}mm ${margins.bottom || 20}mm ${margins.left || 20}mm;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .pdf-header {
        position: fixed;
        top: 0;
        left: ${margins.left || 20}mm;
        right: ${margins.right || 20}mm;
        height: 10mm;
        text-align: center;
        font-size: 0.8em;
        color: #999;
        border-bottom: 1px solid #e0e0e0;
      }
      .pdf-footer {
        position: fixed;
        bottom: 0;
        left: ${margins.left || 20}mm;
        right: ${margins.right || 20}mm;
        height: 10mm;
        text-align: center;
        font-size: 0.8em;
        color: #999;
        border-top: 1px solid #e0e0e0;
      }
      .mf-page-break {
        page-break-after: always;
        break-after: page;
      }
    }

    ${themeCSS}

    body {
      font-family: var(--mf-font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      line-height: 1.6;
      color: var(--mf-text-color, #1a1a1a);
      max-width: ${contentWidth}mm;
      margin: 0 auto;
      padding: 0;
    }

    pre {
      background-color: var(--mf-code-bg, #f6f8fa);
      border-radius: 6px;
      padding: 1rem;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
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

    hr {
      border: none;
      border-top: 1px solid var(--mf-border-color, #e0e0e0);
      margin: 2rem 0;
    }

    .mf-math {
      text-align: center;
      margin: 1rem 0;
      font-family: 'Latin Modern Math', 'STIX Two Math', serif;
      font-size: 1.1em;
    }
  </style>
</head>
<body>
  ${headerHTML}
  ${htmlContent}
  ${footerHTML}
</body>
</html>`;
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

/**
 * Render a MarkFlow-Pro AST document to print-optimized HTML for PDF generation.
 *
 * @param ast - The evaluated document AST
 * @param options - PDF rendering options
 * @returns Print-optimized HTML string
 */
export function renderPDF(ast: MFDocument, options: RenderPDFOptions = {}): string {
  const renderer = new PDFRenderer(options);
  return renderer.render(ast);
}

/**
 * Generate a PDF file from a MarkFlow-Pro AST document.
 * This function returns the HTML content that can be saved and opened
 * in a browser, then printed to PDF using the browser's print dialog.
 *
 * For programmatic PDF generation, consider using a headless browser
 * library like Puppeteer.
 *
 * @param ast - The evaluated document AST
 * @param options - PDF rendering options
 * @returns HTML string optimized for PDF printing
 */
export function generatePDF(ast: MFDocument, options: RenderPDFOptions = {}): string {
  return renderPDF(ast, options);
}
