/**
 * MarkFlow-Pro - Main Entry Point
 *
 * Public API for the MarkFlow-Pro typesetting engine.
 * Re-exports all public functions and types for external consumption.
 *
 * @example
 * ```typescript
 * import { parse, evaluate, renderHTML, renderPDF, renderSlides } from 'markflow-pro';
 *
 * const source = '# Hello World';
 * const ast = parse(source);
 * const evaluated = evaluate(ast);
 * const html = renderHTML(evaluated);
 * console.log(html);
 * ```
 */

// Version
export const version = '1.0.0';

// Parser
export { parse } from './parser/parser';
export { tokenize } from './parser/lexer';
export { Parser } from './parser/parser';
export { Lexer } from './parser/lexer';

// AST Types
export type {
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
  MFFunctionCall,
  MFVariableDef,
  MFVariableRef,
  MFConditional,
  MFLoop,
  MFMathInline,
  MFMathBlock,
  MFToc,
  MFFootnote,
  MFFootnoteRef,
  MFPageBreak,
  MFCallout,
  MFComment,
  MFSoftBreak,
  MFHTML,
  MFStrikethrough,
  MFNode,
  MFToken,
} from './parser/types';
export { TokenType } from './parser/types';

// Engine
export { evaluate } from './engine/evaluator';
export { Evaluator, EvaluateOptions } from './engine/evaluator';
export { VariableScope } from './engine/scope';
export { registerBuiltins, getBuiltinFunction } from './engine/builtins';

// Renderers
export { renderHTML, HTMLRenderer, RenderHTMLOptions } from './renderer/html';
export { renderPDF, generatePDF, PDFRenderer, RenderPDFOptions } from './renderer/pdf';
export { renderSlides, generateSlides, SlideRenderer, RenderSlideOptions } from './renderer/slide';

// Themes
export {
  applyTheme,
  getTheme,
  getThemeNames,
  createTheme,
  defaultTheme,
  darkTheme,
  oceanTheme,
  forestTheme,
  sunsetTheme,
  builtInThemes,
} from './renderer/themes';
export type { MFTheme } from './renderer/themes';
