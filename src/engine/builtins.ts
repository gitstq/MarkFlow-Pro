/**
 * MarkFlow-Pro Built-in Function Library
 *
 * Provides all built-in functions available in MarkFlow-Pro documents.
 * Functions are registered in the scope and can be called via the
 * .functionName {arg} {arg} syntax.
 *
 * Built-in functions:
 * - Layout: .page, .columns, .grid, .box, .align, .tabs, .accordion
 * - Content: .callout, .toc, .include, .math, .mermaid
 * - Style: .color, .fontsize, .badge, .progress
 * - Logic: .set, .if, .for, .counter, .timestamp
 */

import { VariableScope, MFValue, MFCallable } from './scope';
import { MFASTNode } from '../parser/types';

/** Register all built-in functions into the given scope */
export function registerBuiltins(scope: VariableScope): void {
  // Layout functions
  scope.set('page', builtinPage as MFCallable);
  scope.set('columns', builtinColumns as MFCallable);
  scope.set('grid', builtinGrid as MFCallable);
  scope.set('box', builtinBox as MFCallable);
  scope.set('align', builtinAlign as MFCallable);
  scope.set('tabs', builtinTabs as MFCallable);
  scope.set('accordion', builtinAccordion as MFCallable);

  // Content functions
  scope.set('callout', builtinCallout as MFCallable);
  scope.set('toc', builtinToc as MFCallable);
  scope.set('include', builtinInclude as MFCallable);
  scope.set('math', builtinMath as MFCallable);
  scope.set('mermaid', builtinMermaid as MFCallable);

  // Style functions
  scope.set('color', builtinColor as MFCallable);
  scope.set('fontsize', builtinFontsize as MFCallable);
  scope.set('badge', builtinBadge as MFCallable);
  scope.set('progress', builtinProgress as MFCallable);

  // Logic functions
  scope.set('set', builtinSet as MFCallable);
  scope.set('if', builtinIf as MFCallable);
  scope.set('for', builtinFor as MFCallable);
  scope.set('counter', builtinCounter as MFCallable);
  scope.set('timestamp', builtinTimestamp as MFCallable);
}

/** Look up a built-in function by name */
export function getBuiltinFunction(name: string, scope: VariableScope): MFCallable | undefined {
  const value = scope.get(name);
  if (typeof value === 'function') {
    return value as MFCallable;
  }
  return undefined;
}

// ============================================================
// Layout Functions
// ============================================================

/**
 * .page {title} {content}
 * Create a page container with a title header.
 */
function builtinPage(args: string[], body: string, scope?: VariableScope): string {
  const title = args[0] || '';
  const content = body ? scope?.resolveReferences(body) || body : '';
  return `<div class="mf-page">\n  <div class="mf-page-title"><h1>${escapeHtml(title)}</h1></div>\n  <div class="mf-page-content">\n${content}\n  </div>\n</div>`;
}

/**
 * .columns {count} {content}
 * Create a multi-column layout.
 */
function builtinColumns(args: string[], body: string, scope?: VariableScope): string {
  const count = parseInt(args[0], 10) || 2;
  const clampedCount = Math.max(1, Math.min(count, 12));
  const content = body ? scope?.resolveReferences(body) || body : '';
  return `<div class="mf-columns" style="column-count: ${clampedCount}; column-gap: 2rem;">\n${content}\n</div>`;
}

/**
 * .grid {cols} {content}
 * Create a CSS grid layout.
 */
function builtinGrid(args: string[], body: string, scope?: VariableScope): string {
  const cols = parseInt(args[0], 10) || 2;
  const clampedCols = Math.max(1, Math.min(cols, 12));
  const content = body ? scope?.resolveReferences(body) || body : '';
  return `<div class="mf-grid" style="display: grid; grid-template-columns: repeat(${clampedCols}, 1fr); gap: 1rem;">\n${content}\n</div>`;
}

/**
 * .box {content}
 * Create a bordered box container.
 */
function builtinBox(args: string[], body: string, scope?: VariableScope): string {
  const content = args[0] || (body ? scope?.resolveReferences(body) || body : '');
  return `<div class="mf-box" style="border: 1px solid var(--mf-border-color, #e0e0e0); border-radius: 8px; padding: 1rem; margin: 0.5rem 0;">${escapeHtml(content)}</div>`;
}

/**
 * .align {direction} {content}
 * Align content to left, center, or right.
 */
function builtinAlign(args: string[], body: string, scope?: VariableScope): string {
  const direction = args[0] || 'left';
  const validDirections = ['left', 'center', 'right', 'justify'];
  const align = validDirections.includes(direction) ? direction : 'left';
  const content = body ? scope?.resolveReferences(body) || body : '';
  return `<div class="mf-align" style="text-align: ${align};">${content}</div>`;
}

/**
 * .tabs {names} {contents}
 * Create tabbed content. Names are comma-separated.
 */
function builtinTabs(args: string[], body: string, scope?: VariableScope): string {
  const names = args[0] || '';
  const tabNames = names.split(',').map((n) => n.trim()).filter((n) => n.length > 0);
  const content = body ? scope?.resolveReferences(body) || body : '';

  const tabId = `mf-tabs-${Math.random().toString(36).substring(2, 9)}`;
  const tabHeaders = tabNames
    .map((name, idx) => `<button class="mf-tab-btn${idx === 0 ? ' active' : ''}" data-tab="${tabId}-${idx}" onclick="mfSwitchTab('${tabId}', '${tabId}-${idx}')">${escapeHtml(name)}</button>`)
    .join('\n');

  const tabPanels = tabNames
    .map((_, idx) => `<div class="mf-tab-panel${idx === 0 ? ' active' : ''}" id="${tabId}-${idx}" style="display: ${idx === 0 ? 'block' : 'none'};">${content}</div>`)
    .join('\n');

  return `<div class="mf-tabs" id="${tabId}">\n  <div class="mf-tab-headers">${tabHeaders}</div>\n  <div class="mf-tab-panels">${tabPanels}</div>\n</div>`;
}

/**
 * .accordion {title} {content}
 * Create a collapsible accordion section.
 */
function builtinAccordion(args: string[], body: string, scope?: VariableScope): string {
  const title = args[0] || 'Section';
  const content = body ? scope?.resolveReferences(body) || body : '';
  const accordionId = `mf-accordion-${Math.random().toString(36).substring(2, 9)}`;

  return `<div class="mf-accordion">\n  <details id="${accordionId}">\n    <summary class="mf-accordion-header">${escapeHtml(title)}</summary>\n    <div class="mf-accordion-content">${content}</div>\n  </details>\n</div>`;
}

// ============================================================
// Content Functions
// ============================================================

/**
 * .callout {type} {title} {content}
 * Create a styled callout/admonition box.
 */
function builtinCallout(args: string[], body: string, scope?: VariableScope): string {
  const calloutType = args[0] || 'info';
  const title = args[1] || getDefaultCalloutTitle(calloutType);
  const content = body ? scope?.resolveReferences(body) || body : '';

  const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
    info: { icon: '\u2139\ufe0f', color: '#2563eb', bg: '#eff6ff' },
    warning: { icon: '\u26a0\ufe0f', color: '#d97706', bg: '#fffbeb' },
    error: { icon: '\u274c', color: '#dc2626', bg: '#fef2f2' },
    tip: { icon: '\u2705', color: '#16a34a', bg: '#f0fdf4' },
    note: { icon: '\ud83d\udcdd', color: '#7c3aed', bg: '#f5f3ff' },
  };

  const config = typeConfig[calloutType] || typeConfig.info;

  return `<div class="mf-callout mf-callout-${calloutType}" style="border-left: 4px solid ${config.color}; background-color: ${config.bg}; padding: 1rem; border-radius: 0 8px 8px 0; margin: 1rem 0;">\n  <div class="mf-callout-header" style="font-weight: bold; color: ${config.color}; margin-bottom: 0.5rem;">${config.icon} ${escapeHtml(title)}</div>\n  <div class="mf-callout-content">${content}</div>\n</div>`;
}

/**
 * .toc
 * Generate a table of contents placeholder.
 * The actual TOC is generated during rendering.
 */
function builtinToc(_args: string[], _body: string, _scope?: VariableScope): string {
  return `<div class="mf-toc" data-mf-toc="true"></div>`;
}

/**
 * .include {path}
 * Include an external file's content.
 */
function builtinInclude(args: string[], _body: string, _scope?: VariableScope): string {
  const path = args[0] || '';
  if (!path) {
    return `<div class="mf-include-error" style="color: red;">Error: .include requires a file path argument.</div>`;
  }
  // Note: File system access is handled at a higher level for security.
  // This returns a placeholder that can be resolved by the CLI or web editor.
  return `<div class="mf-include" data-mf-include-path="${escapeHtml(path)}"><!-- Included file: ${escapeHtml(path)} --></div>`;
}

/**
 * .math {expression}
 * Render a math expression.
 */
function builtinMath(args: string[], _body: string, _scope?: VariableScope): string {
  const expression = args[0] || '';
  return `<div class="mf-math" data-mf-math="${escapeHtml(expression)}">\\(${escapeHtml(expression)}\\)</div>`;
}

/**
 * .mermaid {code}
 * Embed a Mermaid diagram.
 */
function builtinMermaid(args: string[], body: string, scope?: VariableScope): string {
  const code = args[0] || (body ? scope?.resolveReferences(body) || body : '');
  return `<div class="mf-mermaid"><pre class="mermaid">${escapeHtml(code)}</pre></div>`;
}

// ============================================================
// Style Functions
// ============================================================

/**
 * .color {color} {content}
 * Apply a text color to content.
 */
function builtinColor(args: string[], body: string, scope?: VariableScope): string {
  const color = args[0] || 'inherit';
  const content = body ? scope?.resolveReferences(body) || body : '';
  return `<span class="mf-color" style="color: ${escapeHtml(color)};">${content}</span>`;
}

/**
 * .fontsize {size} {content}
 * Apply a font size to content.
 */
function builtinFontsize(args: string[], body: string, scope?: VariableScope): string {
  const size = args[0] || '1rem';
  const content = body ? scope?.resolveReferences(body) || body : '';
  return `<span class="mf-fontsize" style="font-size: ${escapeHtml(size)};">${content}</span>`;
}

/**
 * .badge {text} {color}
 * Create a badge/label element.
 */
function builtinBadge(args: string[], _body: string, _scope?: VariableScope): string {
  const text = args[0] || '';
  const color = args[1] || '#2563eb';
  return `<span class="mf-badge" style="display: inline-block; padding: 0.2em 0.6em; border-radius: 9999px; font-size: 0.85em; font-weight: 600; color: white; background-color: ${escapeHtml(color)};">${escapeHtml(text)}</span>`;
}

/**
 * .progress {percent}
 * Create a progress bar.
 */
function builtinProgress(args: string[], _body: string, _scope?: VariableScope): string {
  const percent = Math.max(0, Math.min(100, parseInt(args[0], 10) || 0));
  const progressId = `mf-progress-${Math.random().toString(36).substring(2, 9)}`;

  return `<div class="mf-progress" style="width: 100%; background-color: #e5e7eb; border-radius: 9999px; overflow: hidden; height: 8px;">\n  <div class="mf-progress-bar" id="${progressId}" style="width: ${percent}%; background-color: #2563eb; height: 100%; border-radius: 9999px; transition: width 0.3s ease;"></div>\n</div>\n<div class="mf-progress-label" style="text-align: center; font-size: 0.85em; color: #6b7280; margin-top: 0.25rem;">${percent}%</div>`;
}

// ============================================================
// Logic Functions
// ============================================================

/**
 * .set {name} {value}
 * Set a variable in the current scope.
 */
function builtinSet(args: string[], _body: string, scope?: VariableScope): string {
  if (!scope) return '';
  const name = args[0] || '';
  const value = args[1] || '';
  scope.set(name, value);
  return '';
}

/**
 * .if {condition} {then} {.else} {otherwise}
 * Conditional rendering. (Handled by the evaluator, but kept as a builtin for completeness.)
 */
function builtinIf(args: string[], body: string, scope?: VariableScope): string {
  if (!scope) return '';
  const condition = args[0] || '';
  if (scope.evaluateCondition(condition)) {
    return body || '';
  }
  return '';
}

/**
 * .for {var} in {items} {body}
 * Loop rendering. (Handled by the evaluator, but kept as a builtin for completeness.)
 */
function builtinFor(args: string[], body: string, scope?: VariableScope): string {
  if (!scope) return '';
  const variable = args[0] || 'item';
  const collection = args[1] || '';
  const items = collection.split(',').map((item) => item.trim()).filter((item) => item.length > 0);

  let result = '';
  for (const item of items) {
    const childScope = scope.pushChild();
    childScope.set(variable, item);
    result += childScope.resolveReferences(body || '');
  }
  return result;
}

/**
 * .counter {name}
 * Get and auto-increment a named counter.
 */
function builtinCounter(args: string[], _body: string, scope?: VariableScope): string {
  if (!scope) return '0';
  const name = args[0] || 'default';
  return String(scope.getAndIncrementCounter(name));
}

/**
 * .timestamp
 * Get the current timestamp.
 */
function builtinTimestamp(_args: string[], _body: string, _scope?: VariableScope): string {
  return new Date().toISOString();
}

// ============================================================
// Helper Functions
// ============================================================

/** Escape HTML special characters */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Get default title for a callout type */
function getDefaultCalloutTitle(type: string): string {
  const titles: Record<string, string> = {
    info: 'Info',
    warning: 'Warning',
    error: 'Error',
    tip: 'Tip',
    note: 'Note',
  };
  return titles[type] || 'Note';
}
