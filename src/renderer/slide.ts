/**
 * MarkFlow-Pro Slide Renderer
 *
 * Converts an evaluated AST into an HTML slide presentation.
 * Splits content by page breaks or top-level headings into slides.
 * Supports navigation, transitions, and keyboard controls.
 */

import {
  MFASTNode,
  MFDocument,
  MFHeading,
  MFPageBreak,
  MFHTML,
} from '../parser/types';
import { MFTheme, applyTheme } from './themes';

/** Options for slide rendering */
export interface RenderSlideOptions {
  /** Theme to apply */
  theme?: MFTheme;
  /** Slide transition effect */
  transition?: 'none' | 'fade' | 'slide' | 'zoom';
  /** Transition duration in milliseconds */
  transitionDuration?: number;
  /** Whether to show slide numbers */
  showSlideNumbers?: boolean;
  /** Presentation title */
  title?: string;
  /** Author name */
  author?: string;
}

/** A single slide containing its content nodes */
interface Slide {
  /** Slide number (1-based) */
  number: number;
  /** Slide title (from heading or page break context) */
  title: string;
  /** AST nodes for this slide's content */
  content: MFASTNode[];
}

/** Slide Renderer class */
export class SlideRenderer {
  private options: RenderSlideOptions;

  constructor(options: RenderSlideOptions = {}) {
    this.options = {
      transition: 'fade',
      transitionDuration: 300,
      showSlideNumbers: true,
      ...options,
    };
  }

  /**
   * Render a document AST to an HTML slide presentation.
   *
   * @param ast - The evaluated document AST
   * @returns HTML string for the slide presentation
   */
  render(ast: MFDocument): string {
    const slides = this.splitIntoSlides(ast);
    const themeCSS = this.options.theme ? applyTheme(this.options.theme) : '';
    const transition = this.options.transition || 'none';
    const duration = this.options.transitionDuration || 300;

    const slidesHTML = slides
      .map((slide, idx) => {
        const contentHTML = this.renderSlideContent(slide.content);
        const slideNumber = this.options.showSlideNumbers
          ? `<div class="mf-slide-number">${idx + 1} / ${slides.length}</div>`
          : '';
        return `<div class="mf-slide${idx === 0 ? ' active' : ''}" data-slide="${idx}" style="display: ${idx === 0 ? 'flex' : 'none'};">
  <div class="mf-slide-content">
    ${contentHTML}
  </div>
  ${slideNumber}
</div>`;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(this.options.title || 'MarkFlow-Pro Presentation')}</title>
  <style>
    ${themeCSS}

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: var(--mf-font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      background-color: var(--mf-slide-bg, #1a1a2e);
      color: var(--mf-text-color, #ffffff);
      overflow: hidden;
      width: 100vw;
      height: 100vh;
    }

    .mf-slide {
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 4rem;
      transition: opacity ${duration}ms ease, transform ${duration}ms ease;
    }

    .mf-slide-content {
      max-width: 900px;
      width: 100%;
      text-align: center;
    }

    .mf-slide-content h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }

    .mf-slide-content h2 {
      font-size: 2rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .mf-slide-content h3 {
      font-size: 1.5rem;
      margin-bottom: 0.75rem;
    }

    .mf-slide-content p {
      font-size: 1.25rem;
      line-height: 1.8;
      margin-bottom: 1rem;
    }

    .mf-slide-content ul, .mf-slide-content ol {
      text-align: left;
      font-size: 1.25rem;
      line-height: 2;
      margin: 1rem auto;
      max-width: 700px;
    }

    .mf-slide-content pre {
      background-color: var(--mf-code-bg, rgba(255,255,255,0.1));
      border-radius: 8px;
      padding: 1.5rem;
      text-align: left;
      font-size: 1rem;
      overflow-x: auto;
      margin: 1rem 0;
    }

    .mf-slide-content code {
      font-family: var(--mf-font-code, 'Fira Code', 'Consolas', monospace);
    }

    .mf-slide-content blockquote {
      border-left: 4px solid var(--mf-link-color, #2563eb);
      padding-left: 1.5rem;
      text-align: left;
      font-style: italic;
      margin: 1rem auto;
      max-width: 700px;
    }

    .mf-slide-number {
      position: absolute;
      bottom: 1.5rem;
      right: 2rem;
      font-size: 0.85rem;
      color: var(--mf-text-secondary, rgba(255,255,255,0.5));
    }

    .mf-slide-nav {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 0.5rem;
      z-index: 100;
    }

    .mf-slide-nav button {
      background-color: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.2);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.2s;
    }

    .mf-slide-nav button:hover {
      background-color: rgba(255,255,255,0.25);
    }

    .mf-slide-nav button:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .mf-slide-progress {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      background-color: var(--mf-link-color, #2563eb);
      transition: width ${duration}ms ease;
      z-index: 100;
    }

    /* Transition effects */
    .mf-transition-fade-out {
      opacity: 0;
    }
    .mf-transition-fade-in {
      opacity: 1;
    }
    .mf-transition-slide-out {
      transform: translateX(-100%);
      opacity: 0;
    }
    .mf-transition-slide-in {
      transform: translateX(0);
      opacity: 1;
    }
    .mf-transition-zoom-out {
      transform: scale(0.8);
      opacity: 0;
    }
    .mf-transition-zoom-in {
      transform: scale(1);
      opacity: 1;
    }
  </style>
</head>
<body>
  <div class="mf-slide-progress" id="mf-progress" style="width: ${(1 / slides.length) * 100}%;"></div>

  ${slidesHTML}

  <div class="mf-slide-nav">
    <button id="mf-prev" onclick="mfNavigate(-1)" ${slides.length <= 1 ? 'disabled' : ''}>&#9664; Prev</button>
    <button id="mf-next" onclick="mfNavigate(1)" ${slides.length <= 1 ? 'disabled' : ''}>Next &#9654;</button>
  </div>

  <script>
    let currentSlide = 0;
    const totalSlides = ${slides.length};
    const transition = '${transition}';

    function mfNavigate(direction) {
      const newSlide = currentSlide + direction;
      if (newSlide < 0 || newSlide >= totalSlides) return;

      const current = document.querySelector('.mf-slide.active');
      const next = document.querySelector('[data-slide="' + newSlide + '"]');

      if (!current || !next) return;

      // Apply transition out
      if (transition !== 'none') {
        current.classList.add('mf-transition-' + transition + '-out');
      }
      current.style.display = 'none';
      current.classList.remove('active');

      // Apply transition in
      next.style.display = 'flex';
      next.classList.add('active');
      if (transition !== 'none') {
        next.classList.add('mf-transition-' + transition + '-in');
        setTimeout(function() {
          next.classList.remove('mf-transition-' + transition + '-in');
        }, ${duration});
      }

      currentSlide = newSlide;
      updateControls();
    }

    function updateControls() {
      const prev = document.getElementById('mf-prev');
      const next = document.getElementById('mf-next');
      const progress = document.getElementById('mf-progress');

      if (prev) prev.disabled = currentSlide === 0;
      if (next) next.disabled = currentSlide === totalSlides - 1;
      if (progress) progress.style.width = ((currentSlide + 1) / totalSlides * 100) + '%';
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        mfNavigate(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        mfNavigate(1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        while (currentSlide > 0) mfNavigate(-1);
      } else if (e.key === 'End') {
        e.preventDefault();
        while (currentSlide < totalSlides - 1) mfNavigate(1);
      }
    });

    // Touch support
    let touchStartX = 0;
    document.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].screenX;
    });
    document.addEventListener('touchend', function(e) {
      const diff = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(diff) > 50) {
        mfNavigate(diff > 0 ? -1 : 1);
      }
    });
  </script>
</body>
</html>`;
  }

  /**
   * Split a document into slides based on page breaks and headings.
   */
  private splitIntoSlides(ast: MFDocument): Slide[] {
    const slides: Slide[] = [];
    let currentContent: MFASTNode[] = [];
    let currentTitle = '';
    let slideNumber = 0;

    for (const node of ast.children) {
      if (node.type === 'PageBreak') {
        slideNumber++;
        slides.push({
          number: slideNumber,
          title: currentTitle,
          content: [...currentContent],
        });
        currentContent = [];
        currentTitle = '';
        continue;
      }

      if (node.type === 'Heading') {
        const heading = node as MFHeading;
        // Top-level headings (h1) start a new slide
        if (heading.level === 1 && currentContent.length > 0) {
          slideNumber++;
          slides.push({
            number: slideNumber,
            title: currentTitle,
            content: [...currentContent],
          });
          currentContent = [];
        }
        currentTitle = heading.rawText || this.extractText(heading.children);
      }

      currentContent.push(node);
    }

    // Push remaining content as the last slide
    if (currentContent.length > 0) {
      slideNumber++;
      slides.push({
        number: slideNumber,
        title: currentTitle,
        content: currentContent,
      });
    }

    // If no slides were created, create one with all content
    if (slides.length === 0 && ast.children.length > 0) {
      slides.push({
        number: 1,
        title: '',
        content: ast.children,
      });
    }

    return slides;
  }

  /**
   * Render slide content nodes to HTML.
   */
  private renderSlideContent(nodes: MFASTNode[]): string {
    return nodes
      .map((node) => {
        if (node.type === 'HTML') {
          return (node as MFHTML).value;
        }
        return this.renderSlideNode(node);
      })
      .join('\n');
  }

  /**
   * Render a single node for slide display.
   */
  private renderSlideNode(node: MFASTNode): string {
    switch (node.type) {
      case 'Heading': {
        const h = node as MFHeading;
        const text = this.extractText(h.children);
        return `<h${h.level}>${escapeHtml(text)}</h${h.level}>`;
      }
      case 'Paragraph': {
        const text = this.extractText((node as any).children || []);
        return `<p>${escapeHtml(text)}</p>`;
      }
      case 'List': {
        const items = (node as any).children
          .map((item: any) => `<li>${escapeHtml(this.extractText(item.children || []))}</li>`)
          .join('\n');
        const tag = (node as any).ordered ? 'ol' : 'ul';
        return `<${tag}>${items}</${tag}>`;
      }
      case 'CodeBlock': {
        const cb = node as any;
        return `<pre><code>${escapeHtml(cb.value)}</code></pre>`;
      }
      case 'Blockquote': {
        const text = this.extractText((node as any).children || []);
        return `<blockquote><p>${escapeHtml(text)}</p></blockquote>`;
      }
      case 'HR':
        return '<hr style="border-color: rgba(255,255,255,0.2); margin: 1.5rem 0;">';
      case 'HTML':
        return (node as MFHTML).value;
      case 'MathBlock':
        return `<div class="mf-math">\\[${escapeHtml((node as any).expression)}\\]</div>`;
      case 'Image': {
        const img = node as any;
        return `<img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}" style="max-width: 80%; max-height: 60vh; border-radius: 8px;">`;
      }
      default:
        return '';
    }
  }

  /** Extract plain text from child nodes */
  private extractText(nodes: MFASTNode[]): string {
    return nodes
      .map((node) => {
        if (node.type === 'Text') return (node as any).value;
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

/**
 * Render a MarkFlow-Pro AST document to an HTML slide presentation.
 *
 * @param ast - The evaluated document AST
 * @param options - Slide rendering options
 * @returns HTML string for the slide presentation
 */
export function renderSlides(ast: MFDocument, options: RenderSlideOptions = {}): string {
  const renderer = new SlideRenderer(options);
  return renderer.render(ast);
}

/**
 * Generate a slide presentation from a MarkFlow-Pro AST document.
 *
 * @param ast - The evaluated document AST
 * @param options - Slide rendering options
 * @returns HTML string for the slide presentation
 */
export function generateSlides(ast: MFDocument, options: RenderSlideOptions = {}): string {
  return renderSlides(ast, options);
}
