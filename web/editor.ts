/**
 * MarkFlow-Pro Web Editor
 *
 * Manages the web editor interface with real-time parsing and preview.
 * Features:
 * - Real-time parsing and preview with debounced updates
 * - Theme switching (default, dark, ocean, forest, sunset)
 * - Format selection (HTML, Slides)
 * - File import/export
 * - Resizable split pane
 */

interface ThemeConfig {
  name: string;
  textColor: string;
  textSecondary: string;
  bgColor: string;
  codeBg: string;
  linkColor: string;
  borderColor: string;
  tableHeader: string;
  headingColor: string;
  isDark: boolean;
}

const THEMES: Record<string, ThemeConfig> = {
  default: {
    name: 'default',
    textColor: '#1a1a1a',
    textSecondary: '#6b7280',
    bgColor: '#ffffff',
    codeBg: '#f6f8fa',
    linkColor: '#2563eb',
    borderColor: '#e0e0e0',
    tableHeader: '#f6f8fa',
    headingColor: '#111827',
    isDark: false,
  },
  dark: {
    name: 'dark',
    textColor: '#e5e7eb',
    textSecondary: '#9ca3af',
    bgColor: '#111827',
    codeBg: '#1f2937',
    linkColor: '#60a5fa',
    borderColor: '#374151',
    tableHeader: '#1f2937',
    headingColor: '#f9fafb',
    isDark: true,
  },
  ocean: {
    name: 'ocean',
    textColor: '#1e293b',
    textSecondary: '#64748b',
    bgColor: '#f0f9ff',
    codeBg: '#e0f2fe',
    linkColor: '#0284c7',
    borderColor: '#bae6fd',
    tableHeader: '#e0f2fe',
    headingColor: '#0c4a6e',
    isDark: false,
  },
  forest: {
    name: 'forest',
    textColor: '#1a2e1a',
    textSecondary: '#4a6741',
    bgColor: '#f0fdf4',
    codeBg: '#dcfce7',
    linkColor: '#15803d',
    borderColor: '#bbf7d0',
    tableHeader: '#dcfce7',
    headingColor: '#14532d',
    isDark: false,
  },
  sunset: {
    name: 'sunset',
    textColor: '#431407',
    textSecondary: '#9a3412',
    bgColor: '#fffbeb',
    codeBg: '#fef3c7',
    linkColor: '#c2410c',
    borderColor: '#fed7aa',
    tableHeader: '#fef3c7',
    headingColor: '#7c2d12',
    isDark: false,
  },
};

/**
 * Simple MarkFlow-Pro parser for the browser.
 * Handles basic Markdown + MarkFlow function calls.
 */
class BrowserParser {
  private source: string;

  constructor(source: string) {
    this.source = source;
  }

  parse(): string {
    let html = this.source;

    // Process function calls
    html = this.processFunctionCalls(html);

    // Process code blocks (must be before other inline processing)
    html = this.processCodeBlocks(html);

    // Process headings
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Process horizontal rules
    html = html.replace(/^---+$/gm, '<hr>');

    // Process blockquotes
    html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>');

    // Process bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Process italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Process strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // Process inline code
    html = html.replace(/`([^`]+?)`/g, '<code>$1</code>');

    // Process images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

    // Process links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Process inline math
    html = html.replace(/\$([^$\n]+?)\$/g, '<span class="mf-math-inline">\\($1\\)</span>');

    // Process block math
    html = html.replace(/\$\$([^$]+?)\$\$/g, '<div class="mf-math">\\[$1\\]</div>');

    // Process unordered list items
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Process ordered list items
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Process paragraphs (lines not already wrapped in HTML tags)
    html = html.replace(/^(?!<[hupobld]|<li|<ul|<ol|<hr|<div|<table|<blockquote|<pre)(.+)$/gm, '<p>$1</p>');

    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
  }

  private processCodeBlocks(html: string): string {
    return html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang: string, code: string) => {
      const escapedCode = this.escapeHtml(code.trim());
      return `<pre><code class="language-${lang || 'text'}">${escapedCode}</code></pre>`;
    });
  }

  private processFunctionCalls(html: string): string {
    // .callout {type} {title} {body}
    html = html.replace(
      /\.callout\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([\s\S]*?)\}/g,
      (_match, type: string, title: string, body: string) => {
        const typeColors: Record<string, { color: string; bg: string; icon: string }> = {
          info: { color: '#2563eb', bg: '#eff6ff', icon: '\u2139\ufe0f' },
          warning: { color: '#d97706', bg: '#fffbeb', icon: '\u26a0\ufe0f' },
          error: { color: '#dc2626', bg: '#fef2f2', icon: '\u274c' },
          tip: { color: '#16a34a', bg: '#f0fdf4', icon: '\u2705' },
          note: { color: '#7c3aed', bg: '#f5f3ff', icon: '\ud83d\udcdd' },
        };
        const config = typeColors[type] || typeColors.info;
        const parsedBody = this.parseInline(body.trim());
        return `<div class="mf-callout mf-callout-${type}" style="border-left: 4px solid ${config.color}; background-color: ${config.bg}; padding: 1rem; border-radius: 0 8px 8px 0; margin: 1rem 0;">
  <div style="font-weight: bold; color: ${config.color}; margin-bottom: 0.5rem;">${config.icon} ${this.escapeHtml(title)}</div>
  <div>${parsedBody}</div>
</div>`;
      }
    );

    // .page {title} {body}
    html = html.replace(
      /\.page\s*\{([^}]*)\}\s*\{([\s\S]*?)\}/g,
      (_match, title: string, body: string) => {
        const parsedBody = this.parseInline(body.trim());
        return `<div class="mf-page">
  <div class="mf-page-title"><h1>${this.escapeHtml(title)}</h1></div>
  <div class="mf-page-content">${parsedBody}</div>
</div>`;
      }
    );

    // .columns {count} {body}
    html = html.replace(
      /\.columns\s*\{(\d+)\}\s*\{([\s\S]*?)\}/g,
      (_match, count: string, body: string) => {
        const parsedBody = this.parseInline(body.trim());
        return `<div class="mf-columns" style="column-count: ${count}; column-gap: 2rem;">${parsedBody}</div>`;
      }
    );

    // .grid {cols} {body}
    html = html.replace(
      /\.grid\s*\{(\d+)\}\s*\{([\s\S]*?)\}/g,
      (_match, cols: string, body: string) => {
        const parsedBody = this.parseInline(body.trim());
        return `<div class="mf-grid" style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 1rem;">${parsedBody}</div>`;
      }
    );

    // .box {content}
    html = html.replace(
      /\.box\s*\{([^}]*)\}/g,
      (_match, content: string) => {
        return `<div class="mf-box">${this.escapeHtml(content)}</div>`;
      }
    );

    // .align {direction} {body}
    html = html.replace(
      /\.align\s*\{([^}]*)\}\s*\{([\s\S]*?)\}/g,
      (_match, direction: string, body: string) => {
        const parsedBody = this.parseInline(body.trim());
        return `<div style="text-align: ${direction};">${parsedBody}</div>`;
      }
    );

    // .color {color} {body}
    html = html.replace(
      /\.color\s*\{([^}]*)\}\s*\{([^}]*)\}/g,
      (_match, color: string, body: string) => {
        return `<span style="color: ${color};">${this.escapeHtml(body)}</span>`;
      }
    );

    // .fontsize {size} {body}
    html = html.replace(
      /\.fontsize\s*\{([^}]*)\}\s*\{([^}]*)\}/g,
      (_match, size: string, body: string) => {
        return `<span style="font-size: ${size};">${this.escapeHtml(body)}</span>`;
      }
    );

    // .badge {text} {color}
    html = html.replace(
      /\.badge\s*\{([^}]*)\}\s*\{([^}]*)\}/g,
      (_match, text: string, color: string) => {
        return `<span class="mf-badge" style="background-color: ${color};">${this.escapeHtml(text)}</span>`;
      }
    );

    // .progress {percent}
    html = html.replace(
      /\.progress\s*\{(\d+)\}/g,
      (_match, percent: string) => {
        return `<div class="mf-progress"><div class="mf-progress-bar" style="width: ${percent}%;"></div></div>
<div style="text-align: center; font-size: 0.85em; color: #6b7280; margin-top: 0.25rem;">${percent}%</div>`;
      }
    );

    // .toc
    html = html.replace(
      /^\.toc\s*$/gm,
      '<div class="mf-toc" data-mf-toc="true"><h3>Table of Contents</h3><p><em>Table of contents will be generated during full build.</em></p></div>'
    );

    // .timestamp
    html = html.replace(
      /^\.timestamp\s*$/gm,
      `<span>${new Date().toISOString()}</span>`
    );

    return html;
  }

  private parseInline(text: string): string {
    let result = text;
    result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
    result = result.replace(/`([^`]+?)`/g, '<code>$1</code>');
    result = result.replace(/~~(.+?)~~/g, '<del>$1</del>');
    result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    result = result.replace(/\$([^$\n]+?)\$/g, '<span class="mf-math-inline">\\($1\\)</span>');
    return result;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

/**
 * MarkFlow-Pro Web Editor class
 */
class MarkFlowEditor {
  private editor: HTMLTextAreaElement;
  private preview: HTMLDivElement;
  private editorStatus: HTMLSpanElement;
  private previewStatus: HTMLSpanElement;
  private filenameEl: HTMLSpanElement;
  private themeSelect: HTMLSelectElement;
  private formatSelect: HTMLSelectElement;
  private importBtn: HTMLButtonElement;
  private exportBtn: HTMLButtonElement;
  private fileInput: HTMLInputElement;
  private divider: HTMLDivElement;
  private debounceTimer: ReturnType<typeof setTimeout> | null;
  private currentTheme: string;
  private currentFormat: string;
  private filename: string;

  constructor() {
    this.editor = document.getElementById('editor') as HTMLTextAreaElement;
    this.preview = document.getElementById('preview') as HTMLDivElement;
    this.editorStatus = document.getElementById('editor-status') as HTMLSpanElement;
    this.previewStatus = document.getElementById('preview-status') as HTMLSpanElement;
    this.filenameEl = document.getElementById('filename') as HTMLSpanElement;
    this.themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
    this.formatSelect = document.getElementById('format-select') as HTMLSelectElement;
    this.importBtn = document.getElementById('btn-import') as HTMLButtonElement;
    this.exportBtn = document.getElementById('btn-export') as HTMLButtonElement;
    this.fileInput = document.getElementById('file-input') as HTMLInputElement;
    this.divider = document.getElementById('divider') as HTMLDivElement;
    this.debounceTimer = null;
    this.currentTheme = 'default';
    this.currentFormat = 'html';
    this.filename = 'untitled.mf';

    this.init();
  }

  private init(): void {
    // Editor input handler with debounce
    this.editor.addEventListener('input', () => {
      this.scheduleUpdate();
    });

    // Tab key support in editor
    this.editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        this.editor.value = this.editor.value.substring(0, start) + '  ' + this.editor.value.substring(end);
        this.editor.selectionStart = this.editor.selectionEnd = start + 2;
        this.scheduleUpdate();
      }
    });

    // Theme selector
    this.themeSelect.addEventListener('change', () => {
      this.currentTheme = this.themeSelect.value;
      this.applyTheme();
      this.updatePreview();
    });

    // Format selector
    this.formatSelect.addEventListener('change', () => {
      this.currentFormat = this.formatSelect.value;
      this.updatePreview();
    });

    // Import button
    this.importBtn.addEventListener('click', () => {
      this.fileInput.click();
    });

    this.fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        this.importFile(target.files[0]);
      }
    });

    // Export button
    this.exportBtn.addEventListener('click', () => {
      this.exportFile();
    });

    // Resizable divider
    this.initDivider();

    // Set default content
    this.setDefaultContent();

    // Initial preview
    this.updatePreview();
  }

  private scheduleUpdate(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.updatePreview();
    }, 300);
  }

  private updatePreview(): void {
    const source = this.editor.value;

    if (!source.trim()) {
      this.preview.innerHTML = '<div class="preview-placeholder"><p>Start typing in the editor to see a live preview.</p></div>';
      this.previewStatus.textContent = 'Ready';
      return;
    }

    try {
      this.previewStatus.textContent = 'Updating...';
      this.editorStatus.textContent = 'Parsing...';

      const parser = new BrowserParser(source);

      if (this.currentFormat === 'slides') {
        this.renderSlidePreview(source);
      } else {
        const html = parser.parse();
        this.preview.innerHTML = html;
      }

      // Apply syntax highlighting to code blocks
      if (typeof hljs !== 'undefined') {
        this.preview.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block as HTMLElement);
        });
      }

      this.previewStatus.textContent = 'Ready';
      this.editorStatus.textContent = `${source.split('\n').length} lines`;
    } catch (error) {
      this.preview.innerHTML = `<div style="color: red; padding: 1rem;"><strong>Parse Error:</strong> ${(error as Error).message}</div>`;
      this.previewStatus.textContent = 'Error';
      this.editorStatus.textContent = 'Error';
    }
  }

  private renderSlidePreview(source: string): void {
    const parser = new BrowserParser(source);
    const html = parser.parse();

    // Split by page breaks or h1 headings
    const slides = html.split(/<h1>|<div class="mf-page">/).filter((s) => s.trim());

    let slideHTML = '';
    slides.forEach((slideContent, idx) => {
      const isActive = idx === 0;
      slideHTML += `<div class="mf-slide" style="display: ${isActive ? 'flex' : 'none'}; min-height: 80vh; flex-direction: column; justify-content: center; align-items: center; padding: 3rem; text-align: center;">
  <div>${slideContent}</div>
  <div style="position: absolute; bottom: 1rem; right: 2rem; font-size: 0.85em; color: #999;">${idx + 1} / ${slides.length}</div>
</div>`;
    });

    this.preview.innerHTML = `
<div style="background: #1a1a2e; min-height: 100%; position: relative;">
  ${slideHTML}
  <div style="position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); display: flex; gap: 0.5rem; z-index: 10;">
    <button onclick="window._mfSlideNav(-1)" style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">&#9664; Prev</button>
    <button onclick="window._mfSlideNav(1)" style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">Next &#9654;</button>
  </div>
</div>
<script>
  window._mfCurrentSlide = 0;
  window._mfTotalSlides = ${slides.length};
  window._mfSlideNav = function(dir) {
    var slides = document.querySelectorAll('.mf-slide');
    var newIdx = window._mfCurrentSlide + dir;
    if (newIdx < 0 || newIdx >= window._mfTotalSlides) return;
    slides[window._mfCurrentSlide].style.display = 'none';
    slides[newIdx].style.display = 'flex';
    window._mfCurrentSlide = newIdx;
  };
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') window._mfSlideNav(-1);
    if (e.key === 'ArrowRight') window._mfSlideNav(1);
  });
<\/script>`;
  }

  private applyTheme(): void {
    const theme = THEMES[this.currentTheme] || THEMES.default;
    const previewPane = document.getElementById('preview-pane');

    if (theme.isDark) {
      document.body.classList.add('dark-preview');
    } else {
      document.body.classList.remove('dark-preview');
    }

    // Apply theme variables to preview
    previewPane.style.setProperty('--preview-text', theme.textColor);
    previewPane.style.setProperty('--preview-text-secondary', theme.textSecondary);
    previewPane.style.setProperty('--preview-bg', theme.bgColor);
    previewPane.style.setProperty('--preview-code-bg', theme.codeBg);
    previewPane.style.setProperty('--preview-link', theme.linkColor);
    previewPane.style.setProperty('--preview-border', theme.borderColor);
    previewPane.style.setProperty('--preview-table-header', theme.tableHeader);
    previewPane.style.setProperty('--preview-heading', theme.headingColor);
  }

  private importFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      this.editor.value = content;
      this.filename = file.name;
      this.filenameEl.textContent = file.name;
      this.updatePreview();
    };
    reader.readAsText(file);
  }

  private exportFile(): void {
    const source = this.editor.value;

    if (this.currentFormat === 'slides') {
      // Export as slide HTML
      const parser = new BrowserParser(source);
      const html = parser.parse();
      const fullHTML = this.generateSlideExportHTML(html);
      this.downloadFile(fullHTML, this.filename.replace(/\.\w+$/, '.slides.html'), 'text/html');
    } else {
      // Export as full HTML document
      const parser = new BrowserParser(source);
      const html = parser.parse();
      const fullHTML = this.generateFullHTML(html);
      this.downloadFile(fullHTML, this.filename.replace(/\.\w+$/, '.html'), 'text/html');
    }
  }

  private generateFullHTML(bodyContent: string): string {
    const theme = THEMES[this.currentTheme] || THEMES.default;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(this.filename)}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"><\/script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: ${theme.textColor};
      background-color: ${theme.bgColor};
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    pre { background-color: ${theme.codeBg}; border-radius: 6px; padding: 1rem; overflow-x: auto; }
    code { font-family: 'Fira Code', Consolas, monospace; font-size: 0.9em; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid ${theme.borderColor}; padding: 0.5rem 1rem; }
    th { background-color: ${theme.tableHeader}; font-weight: 600; }
    blockquote { border-left: 4px solid ${theme.borderColor}; padding-left: 1rem; color: ${theme.textSecondary}; margin: 1rem 0; }
    a { color: ${theme.linkColor}; }
    hr { border: none; border-top: 1px solid ${theme.borderColor}; margin: 2rem 0; }
    img { max-width: 100%; }
    h1 { border-bottom: 1px solid ${theme.borderColor}; padding-bottom: 0.3em; }
  </style>
</head>
<body>
${bodyContent}
<script>hljs.highlightAll();<\/script>
</body>
</html>`;
  }

  private generateSlideExportHTML(bodyContent: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(this.filename)} - Slides</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: white; }
    .slide { display: none; min-height: 100vh; flex-direction: column; justify-content: center; align-items: center; padding: 4rem; text-align: center; }
    .slide.active { display: flex; }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    h2 { font-size: 2rem; margin-bottom: 1rem; }
    p { font-size: 1.25rem; line-height: 1.8; }
    .nav { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); display: flex; gap: 0.5rem; }
    .nav button { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="slide active">${bodyContent}</div>
  <div class="nav">
    <button onclick="navigate(-1)">&#9664; Prev</button>
    <button onclick="navigate(1)">Next &#9654;</button>
  </div>
  <script>
    function navigate(d) { /* Basic navigation placeholder */ }
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'ArrowLeft') navigate(-1);
    });
  <\/script>
</body>
</html>`;
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private initDivider(): void {
    let isDragging = false;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      this.divider.classList.add('active');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const mainContent = document.getElementById('main-content');
      const rect = mainContent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      const clamped = Math.max(20, Math.min(80, percentage));

      const editorPane = document.getElementById('editor-pane');
      editorPane.style.width = `${clamped}%`;
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      this.divider.classList.remove('active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    this.divider.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // Touch support
    this.divider.addEventListener('touchstart', (e) => {
      isDragging = true;
      this.divider.classList.add('active');
      e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const mainContent = document.getElementById('main-content');
      const rect = mainContent.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      const clamped = Math.max(20, Math.min(80, percentage));
      const editorPane = document.getElementById('editor-pane');
      editorPane.style.width = `${clamped}%`;
    });

    document.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      this.divider.classList.remove('active');
    });
  }

  private setDefaultContent(): void {
    this.editor.value = `# Welcome to MarkFlow-Pro

.page {My Document} {
  This is a **function-based** markdown typesetting engine.

  .callout {info} {Did you know?} {
    MarkFlow-Pro extends standard Markdown with powerful function calls.
  }
}

## Features

.columns {2} {
  ### Multi-Format Output
  Render your documents as HTML, PDF, or presentation slides.

  ### Live Preview
  Edit and preview in real-time with our web editor.
}

.grid {3} {
  .box {Feature 1}
  .box {Feature 2}
  .box {Feature 3}
}

## Code Example

\`\`\`javascript
const result = markflow.parse(source);
const html = markflow.renderHTML(result);
console.log(html);
\`\`\`

## Math Support

Inline math: $E = mc^2$

Block math:
$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

## Progress

.progress {75}

## Badges

.badge {New} {#2563eb}
.badge {Stable} {#16a34a}
.badge {Beta} {#d97706}

.toc
`;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Initialize editor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new MarkFlowEditor();
});
