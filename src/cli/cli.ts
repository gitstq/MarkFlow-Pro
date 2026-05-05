#!/usr/bin/env node
/**
 * MarkFlow-Pro CLI
 *
 * Command-line interface for MarkFlow-Pro typesetting engine.
 * Provides commands for building documents, watching for changes,
 * and initializing new projects.
 *
 * Usage:
 *   markflow build <input> -o <output> --format <html|pdf|slides> --theme <name>
 *   markflow watch <input> --port <port>
 *   markflow init <name>
 *   markflow --version
 *   markflow --help
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from '../parser/parser';
import { evaluate } from '../engine/evaluator';
import { renderHTML } from '../renderer/html';
import { generatePDF } from '../renderer/pdf';
import { generateSlides } from '../renderer/slide';
import { getTheme, getThemeNames } from '../renderer/themes';

const VERSION = '1.0.0';

const program = new Command();

program
  .name('markflow')
  .description('Lightweight Markdown Function-Based Typesetting Engine')
  .version(VERSION);

// ============================================================
// Build Command
// ============================================================

program
  .command('build')
  .description('Build a MarkFlow-Pro document')
  .argument('<input>', 'Input .mf file path')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Output format: html, pdf, slides', 'html')
  .option('-t, --theme <name>', 'Theme name', 'default')
  .option('--title <title>', 'Document title')
  .action((inputPath: string, options: {
    output?: string;
    format?: string;
    theme?: string;
    title?: string;
  }) => {
    try {
      const resolvedInput = path.resolve(inputPath);

      if (!fs.existsSync(resolvedInput)) {
        console.error(`Error: Input file not found: ${resolvedInput}`);
        process.exit(1);
      }

      const source = fs.readFileSync(resolvedInput, 'utf-8');
      const baseDir = path.dirname(resolvedInput);

      // Parse
      const ast = parse(source);

      // Evaluate
      const evaluated = evaluate(ast, { baseDir });

      // Get theme
      const theme = getTheme(options.theme || 'default');

      // Determine output path
      const format = (options.format || 'html').toLowerCase();
      let outputPath = options.output;

      if (!outputPath) {
        const ext = format === 'pdf' ? 'html' : format;
        const baseName = path.basename(resolvedInput, path.extname(resolvedInput));
        outputPath = path.join(baseDir, `${baseName}.${ext}`);
      }

      const resolvedOutput = path.resolve(outputPath);

      // Render
      let output: string;
      switch (format) {
        case 'html':
          output = renderHTML(evaluated, {
            theme,
            fullDocument: true,
            title: options.title,
          });
          break;

        case 'pdf':
          output = generatePDF(evaluated, {
            theme,
            title: options.title,
            outputPath: resolvedOutput,
          });
          break;

        case 'slides':
          output = generateSlides(evaluated, {
            theme,
            title: options.title,
          });
          break;

        default:
          console.error(`Error: Unknown format '${format}'. Supported formats: html, pdf, slides`);
          process.exit(1);
          return;
      }

      // Write output
      const outputDir = path.dirname(resolvedOutput);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(resolvedOutput, output, 'utf-8');
      console.log(`Successfully built: ${resolvedOutput} (${format})`);
    } catch (error) {
      console.error(`Error building document: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// ============================================================
// Watch Command
// ============================================================

program
  .command('watch')
  .description('Watch a MarkFlow-Pro file and serve live preview')
  .argument('<input>', 'Input .mf file path')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('-t, --theme <name>', 'Theme name', 'default')
  .action((inputPath: string, options: { port?: string; theme?: string }) => {
    try {
      const resolvedInput = path.resolve(inputPath);

      if (!fs.existsSync(resolvedInput)) {
        console.error(`Error: Input file not found: ${resolvedInput}`);
        process.exit(1);
      }

      const port = parseInt(options.port || '3000', 10);
      const theme = getTheme(options.theme || 'default');

      // Create HTTP server
      const http = require('http');

      const server = http.createServer((req: any, res: any) => {
        if (req.url === '/' || req.url === '/index.html') {
          // Serve the web editor
          const editorHtml = generateLivePreviewHTML(resolvedInput, theme);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(editorHtml);
        } else if (req.url === '/api/preview') {
          // API endpoint for live preview
          if (req.method === 'GET') {
            try {
              const source = fs.readFileSync(resolvedInput, 'utf-8');
              const ast = parse(source);
              const baseDir = path.dirname(resolvedInput);
              const evaluated = evaluate(ast, { baseDir });
              const html = renderHTML(evaluated, { theme, fullDocument: false });

              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(html);
            } catch (parseError) {
              res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
              res.end(`Parse error: ${(parseError as Error).message}`);
            }
          } else {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method not allowed');
          }
        } else if (req.url === '/api/source') {
          // API endpoint to get source content
          if (req.method === 'GET') {
            const source = fs.readFileSync(resolvedInput, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(source);
          } else {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method not allowed');
          }
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not found');
        }
      });

      server.listen(port, () => {
        console.log(`MarkFlow-Pro live preview server running at http://localhost:${port}`);
        console.log(`Watching: ${resolvedInput}`);
        console.log('Press Ctrl+C to stop.');
      });

      // Watch for file changes
      fs.watchFile(resolvedInput, { interval: 500 }, () => {
        console.log(`[${new Date().toLocaleTimeString()}] File changed: ${path.basename(resolvedInput)}`);
      });
    } catch (error) {
      console.error(`Error starting watch server: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// ============================================================
// Init Command
// ============================================================

program
  .command('init')
  .description('Initialize a new MarkFlow-Pro project')
  .argument('<name>', 'Project name')
  .action((name: string) => {
    try {
      const projectDir = path.resolve(name);

      if (fs.existsSync(projectDir)) {
        console.error(`Error: Directory already exists: ${projectDir}`);
        process.exit(1);
      }

      // Create project directory
      fs.mkdirSync(projectDir, { recursive: true });

      // Create basic project files
      const packageJson = {
        name: name.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        description: `A MarkFlow-Pro document project`,
        scripts: {
          build: 'markflow build index.mf -o output.html',
          watch: 'markflow watch index.mf',
        },
        dependencies: {
          'markflow-pro': '^1.0.0',
        },
      };

      const exampleContent = `# ${name}

Welcome to your new MarkFlow-Pro project!

## Getting Started

Edit this file and run:

\`\`\`bash
markflow watch index.mf
\`\`\`

## Features

.columns {2} {
  ### Live Preview
  Edit and see changes in real-time.

  ### Multi-Format
  Export to HTML, PDF, or slides.
}

.callout {tip} {Pro Tip} {
  Use the .page function to create titled sections.
}
`;

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(packageJson, null, 2),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(projectDir, 'index.mf'),
        exampleContent,
        'utf-8'
      );

      console.log(`Successfully initialized project: ${projectDir}`);
      console.log(`  - package.json`);
      console.log(`  - index.mf`);
      console.log(`\nNext steps:`);
      console.log(`  cd ${name}`);
      console.log(`  npm install`);
      console.log(`  markflow watch index.mf`);
    } catch (error) {
      console.error(`Error initializing project: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// ============================================================
// Helper Functions
// ============================================================

/**
 * Generate a live preview HTML page.
 */
function generateLivePreviewHTML(inputPath: string, theme: any): string {
  const source = fs.existsSync(inputPath) ? fs.readFileSync(inputPath, 'utf-8') : '';
  const themeCSS = `
    :root {
      --mf-text-color: ${theme.colors.text};
      --mf-text-secondary: ${theme.colors.textSecondary};
      --mf-background-color: ${theme.colors.background};
      --mf-code-bg: ${theme.colors.codeBackground};
      --mf-link-color: ${theme.colors.link};
      --mf-border-color: ${theme.colors.border};
      --mf-table-header-bg: ${theme.colors.tableHeader};
      --mf-heading-color: ${theme.colors.heading};
      --mf-font-body: ${theme.fonts.body};
      --mf-font-code: ${theme.fonts.code};
    }
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MarkFlow-Pro Live Preview</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${theme.codeHighlightStyle}.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.0/marked.min.js"></script>
  <style>
    ${themeCSS}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: var(--mf-font-body); display: flex; height: 100vh; overflow: hidden; }
    #editor-pane {
      width: 50%; display: flex; flex-direction: column; border-right: 2px solid var(--mf-border-color);
    }
    #preview-pane {
      width: 50%; overflow-y: auto; padding: 2rem; background-color: var(--mf-background-color);
    }
    #toolbar {
      padding: 0.5rem 1rem; background: #f3f4f6; border-bottom: 1px solid var(--mf-border-color);
      display: flex; align-items: center; gap: 1rem; font-size: 0.9rem;
    }
    #toolbar .filename { font-weight: 600; color: var(--mf-heading-color); }
    #toolbar .status { color: var(--mf-text-secondary); margin-left: auto; }
    #editor {
      flex: 1; resize: none; border: none; padding: 1rem; font-family: var(--mf-font-code);
      font-size: 14px; line-height: 1.6; background: #fafafa; color: var(--mf-text-color);
      outline: none; tab-size: 2;
    }
    #preview { line-height: 1.6; color: var(--mf-text-color); }
    #preview h1, #preview h2, #preview h3 { color: var(--mf-heading-color); margin-top: 1.5rem; margin-bottom: 0.75rem; }
    #preview p { margin-bottom: 1rem; }
    #preview pre { background: var(--mf-code-bg); border-radius: 6px; padding: 1rem; overflow-x: auto; margin: 1rem 0; }
    #preview code { font-family: var(--mf-font-code); font-size: 0.9em; }
    #preview table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    #preview th, #preview td { border: 1px solid var(--mf-border-color); padding: 0.5rem 1rem; }
    #preview th { background: var(--mf-table-header-bg); font-weight: 600; }
    #preview blockquote { border-left: 4px solid var(--mf-border-color); padding-left: 1rem; color: var(--mf-text-secondary); margin: 1rem 0; }
    #preview img { max-width: 100%; }
    #preview a { color: var(--mf-link-color); }
    #preview hr { border: none; border-top: 1px solid var(--mf-border-color); margin: 2rem 0; }
  </style>
</head>
<body>
  <div id="editor-pane">
    <div id="toolbar">
      <span class="filename">${escapeHtml(path.basename(inputPath))}</span>
      <span class="status" id="status">Ready</span>
    </div>
    <textarea id="editor" spellcheck="false">${escapeHtml(source)}</textarea>
  </div>
  <div id="preview-pane">
    <div id="preview">Loading preview...</div>
  </div>
  <script>
    const editor = document.getElementById('editor');
    const preview = document.getElementById('preview');
    const status = document.getElementById('status');
    let debounceTimer = null;

    function updatePreview() {
      status.textContent = 'Updating...';
      fetch('/api/preview')
        .then(r => r.text())
        .then(html => {
          preview.innerHTML = html;
          if (window.hljs) hljs.highlightAll();
          status.textContent = 'Ready';
        })
        .catch(err => {
          preview.innerHTML = '<p style="color: red;">Error: ' + err.message + '</p>';
          status.textContent = 'Error';
        });
    }

    editor.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetch('/api/source', { method: 'PUT', body: editor.value })
          .then(() => updatePreview())
          .catch(() => updatePreview());
      }, 500);
    });

    // Handle tab key in editor
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 2;
      }
    });

    // Initial preview
    updatePreview();
  </script>
</body>
</html>`;
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

// Parse and execute CLI
program.parse(process.argv);
