/**
 * MarkFlow-Pro AST Node Type Definitions
 *
 * Defines all node types used in the MarkFlow-Pro Abstract Syntax Tree.
 * Every node extends the base MFASTNode interface.
 */

/** Base interface for all AST nodes */
export interface MFASTNode {
  /** Unique node type identifier */
  type: string;
  /** Source line number (1-based) for error reporting */
  line: number;
  /** Source column number (1-based) for error reporting */
  column: number;
}

/** Root document node containing all top-level elements */
export interface MFDocument extends MFASTNode {
  type: 'Document';
  /** Ordered list of child nodes */
  children: MFASTNode[];
  /** Document-level metadata (frontmatter) */
  metadata?: Record<string, string>;
}

/** Heading node (h1-h6) */
export interface MFHeading extends MFASTNode {
  type: 'Heading';
  /** Heading level: 1-6 */
  level: number;
  /** Inline content of the heading */
  children: MFASTNode[];
  /** Raw text content for ID generation */
  rawText: string;
}

/** Paragraph node */
export interface MFParagraph extends MFASTNode {
  type: 'Paragraph';
  /** Inline content of the paragraph */
  children: MFASTNode[];
}

/** Plain text node */
export interface MFText extends MFASTNode {
  type: 'Text';
  /** Text content */
  value: string;
}

/** Bold text node */
export interface MFBold extends MFASTNode {
  type: 'Bold';
  /** Inline children inside bold markers */
  children: MFASTNode[];
}

/** Italic text node */
export interface MFItalic extends MFASTNode {
  type: 'Italic';
  /** Inline children inside italic markers */
  children: MFASTNode[];
}

/** Inline code node */
export interface MFCode extends MFASTNode {
  type: 'Code';
  /** Code content */
  value: string;
}

/** Fenced code block node */
export interface MFCodeBlock extends MFASTNode {
  type: 'CodeBlock';
  /** Programming language identifier */
  language: string;
  /** Code content */
  value: string;
}

/** List node (ordered or unordered) */
export interface MFList extends MFASTNode {
  type: 'List';
  /** Whether the list is ordered */
  ordered: boolean;
  /** List items */
  children: MFListItem[];
}

/** Single list item node */
export interface MFListItem extends MFASTNode {
  type: 'ListItem';
  /** Content of the list item */
  children: MFASTNode[];
}

/** Table node */
export interface MFTable extends MFASTNode {
  type: 'Table';
  /** Table header cells */
  header: MFTableCell[];
  /** Table body rows */
  rows: MFTableCell[][];
  /** Column alignment per column: 'left' | 'center' | 'right' | null */
  align: (string | null)[];
}

/** Single table cell */
export interface MFTableCell extends MFASTNode {
  type: 'TableCell';
  /** Cell content */
  children: MFASTNode[];
  /** Whether this cell is a header cell */
  isHeader: boolean;
}

/** Image node */
export interface MFImage extends MFASTNode {
  type: 'Image';
  /** Image source URL or path */
  src: string;
  /** Alt text */
  alt: string;
  /** Optional title */
  title?: string;
}

/** Link node */
export interface MFLink extends MFASTNode {
  type: 'Link';
  /** Link destination URL */
  href: string;
  /** Optional title */
  title?: string;
  /** Inline children */
  children: MFASTNode[];
}

/** Blockquote node */
export interface MFBlockquote extends MFASTNode {
  type: 'Blockquote';
  /** Block content */
  children: MFASTNode[];
}

/** Horizontal rule node */
export interface MFHR extends MFASTNode {
  type: 'HR';
}

/** Function call node (.functionName {arg} {arg} ... {body}) */
export interface MFFunctionCall extends MFASTNode {
  type: 'FunctionCall';
  /** Function name (without the leading dot) */
  name: string;
  /** Ordered list of arguments */
  args: string[];
  /** Body content (parsed AST nodes if present) */
  body?: MFASTNode[];
  /** Raw body string before parsing */
  rawBody?: string;
}

/** Variable definition node (let x = value) */
export interface MFVariableDef extends MFASTNode {
  type: 'VariableDef';
  /** Variable name */
  name: string;
  /** Variable value (string expression) */
  value: string;
}

/** Variable reference node ({variable}) */
export interface MFVariableRef extends MFASTNode {
  type: 'VariableRef';
  /** Variable name */
  name: string;
}

/** Conditional node (if {condition} {body} else {body}) */
export interface MFConditional extends MFASTNode {
  type: 'Conditional';
  /** Condition expression */
  condition: string;
  /** Body to render when condition is truthy */
  thenBody: MFASTNode[];
  /** Body to render when condition is falsy */
  elseBody?: MFASTNode[];
}

/** Loop node (for {var} in {collection} {body}) */
export interface MFLoop extends MFASTNode {
  type: 'Loop';
  /** Loop variable name */
  variable: string;
  /** Collection expression (comma-separated items or variable reference) */
  collection: string;
  /** Body to render for each iteration */
  body: MFASTNode[];
}

/** Inline math node ($expression$) */
export interface MFMathInline extends MFASTNode {
  type: 'MathInline';
  /** Math expression */
  expression: string;
}

/** Block math node ($$expression$$) */
export interface MFMathBlock extends MFASTNode {
  type: 'MathBlock';
  /** Math expression */
  expression: string;
}

/** Table of contents node (:::toc) */
export interface MFToc extends MFASTNode {
  type: 'Toc';
  /** Maximum heading depth to include (default: 3) */
  maxDepth?: number;
}

/** Footnote definition node */
export interface MFFootnote extends MFASTNode {
  type: 'Footnote';
  /** Footnote identifier */
  id: string;
  /** Footnote content */
  children: MFASTNode[];
}

/** Footnote reference node */
export interface MFFootnoteRef extends MFASTNode {
  type: 'FootnoteRef';
  /** Footnote identifier */
  id: string;
}

/** Page break node (:::pagebreak) */
export interface MFPageBreak extends MFASTNode {
  type: 'PageBreak';
}

/** Callout/admonition node (:::callout type title) */
export interface MFCallout extends MFASTNode {
  type: 'Callout';
  /** Callout type: info, warning, error, tip, note */
  calloutType: string;
  /** Optional title */
  title?: string;
  /** Callout content */
  children: MFASTNode[];
}

/** Comment node (<!-- comment -->) */
export interface MFComment extends MFASTNode {
  type: 'Comment';
  /** Comment text */
  value: string;
}

/** Soft break (newline within inline content) */
export interface MFSoftBreak extends MFASTNode {
  type: 'SoftBreak';
}

/** HTML raw node (passthrough HTML) */
export interface MFHTML extends MFASTNode {
  type: 'HTML';
  /** Raw HTML string */
  value: string;
}

/** Strikethrough text node */
export interface MFStrikethrough extends MFASTNode {
  type: 'Strikethrough';
  /** Inline children */
  children: MFASTNode[];
}

/** Union type of all AST node types */
export type MFNode =
  | MFDocument
  | MFHeading
  | MFParagraph
  | MFText
  | MFBold
  | MFItalic
  | MFCode
  | MFCodeBlock
  | MFList
  | MFListItem
  | MFTable
  | MFTableCell
  | MFImage
  | MFLink
  | MFBlockquote
  | MFHR
  | MFFunctionCall
  | MFVariableDef
  | MFVariableRef
  | MFConditional
  | MFLoop
  | MFMathInline
  | MFMathBlock
  | MFToc
  | MFFootnote
  | MFFootnoteRef
  | MFPageBreak
  | MFCallout
  | MFComment
  | MFSoftBreak
  | MFHTML
  | MFStrikethrough;

/** Token types for the lexer */
export enum TokenType {
  // Standard markdown
  Heading = 'Heading',
  Text = 'Text',
  Bold = 'Bold',
  Italic = 'Italic',
  Code = 'Code',
  CodeBlockStart = 'CodeBlockStart',
  CodeBlockEnd = 'CodeBlockEnd',
  CodeBlockLang = 'CodeBlockLang',
  CodeBlockContent = 'CodeBlockContent',
  ListStart = 'ListStart',
  ListItem = 'ListItem',
  Table = 'Table',
  Image = 'Image',
  Link = 'Link',
  Blockquote = 'Blockquote',
  HR = 'HR',
  Newline = 'Newline',
  EOF = 'EOF',

  // Extended markdown
  FunctionCall = 'FunctionCall',
  FunctionArg = 'FunctionArg',
  FunctionBody = 'FunctionBody',
  VariableDef = 'VariableDef',
  VariableRef = 'VariableRef',
  Conditional = 'Conditional',
  Loop = 'Loop',
  MathInline = 'MathInline',
  MathBlock = 'MathBlock',
  Toc = 'Toc',
  Footnote = 'Footnote',
  FootnoteRef = 'FootnoteRef',
  PageBreak = 'PageBreak',
  Callout = 'Callout',
  Comment = 'Comment',
  HTML = 'HTML',
  Strikethrough = 'Strikethrough',
  SoftBreak = 'SoftBreak',
}

/** Lexer token interface */
export interface MFToken {
  /** Token type */
  type: TokenType;
  /** Token value */
  value: string;
  /** Source line number (1-based) */
  line: number;
  /** Source column number (1-based) */
  column: number;
}
