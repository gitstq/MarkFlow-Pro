/**
 * MarkFlow-Pro Parser
 *
 * Recursive descent parser that converts a stream of tokens into an AST.
 * Handles standard Markdown elements plus MarkFlow-specific extensions:
 * - Function calls, variables, conditionals, loops
 * - Math expressions, directives, callouts
 */

import {
  MFToken,
  TokenType,
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
  MFPageBreak,
  MFCallout,
  MFComment,
  MFHTML,
  MFStrikethrough,
  MFSoftBreak,
  MFNode,
} from './types';
import { tokenize } from './lexer';

/** Parser class that builds an AST from a token stream */
export class Parser {
  private tokens: MFToken[];
  private pos: number;

  constructor(tokens: MFToken[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  /** Parse all tokens into a document AST */
  public parse(): MFDocument {
    const children: MFASTNode[] = [];

    while (this.pos < this.tokens.length && this.current().type !== TokenType.EOF) {
      const node = this.parseBlock();
      if (node) {
        children.push(node);
      }
    }

    return {
      type: 'Document',
      children,
      line: 1,
      column: 1,
    };
  }

  private current(): MFToken {
    return this.tokens[this.pos] || { type: TokenType.EOF, value: '', line: 0, column: 0 };
  }

  private advance(): MFToken {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  private peek(offset: number = 0): MFToken {
    const idx = this.pos + offset;
    return this.tokens[idx] || { type: TokenType.EOF, value: '', line: 0, column: 0 };
  }

  private expect(type: TokenType): MFToken {
    const token = this.current();
    if (token.type !== type) {
      throw new Error(`Expected token type ${type}, got ${token.type} (${token.value}) at line ${token.line}:${token.column}`);
    }
    return this.advance();
  }

  /** Parse a block-level element */
  private parseBlock(): MFASTNode | null {
    const token = this.current();

    switch (token.type) {
      case TokenType.Heading:
        return this.parseHeading();
      case TokenType.CodeBlockStart:
        return this.parseCodeBlock();
      case TokenType.Blockquote:
        return this.parseBlockquote();
      case TokenType.HR:
        return this.parseHR();
      case TokenType.ListItem:
        return this.parseList();
      case TokenType.Table:
        return this.parseTable();
      case TokenType.FunctionCall:
        return this.parseFunctionCall();
      case TokenType.VariableDef:
        return this.parseVariableDef();
      case TokenType.Conditional:
        return this.parseConditional();
      case TokenType.Loop:
        return this.parseLoop();
      case TokenType.MathBlock:
        return this.parseMathBlock();
      case TokenType.Toc:
        return this.parseToc();
      case TokenType.PageBreak:
        return this.parsePageBreak();
      case TokenType.Callout:
        return this.parseCallout();
      case TokenType.Comment:
        return this.parseComment();
      case TokenType.HTML:
        return this.parseHTML();
      case TokenType.Image:
        return this.parseImage();
      case TokenType.Text:
      case TokenType.Bold:
      case TokenType.Italic:
      case TokenType.Code:
      case TokenType.Link:
      case TokenType.MathInline:
      case TokenType.VariableRef:
      case TokenType.Strikethrough:
        return this.parseParagraph();
      default:
        this.advance();
        return null;
    }
  }

  private parseHeading(): MFHeading {
    const token = this.advance();
    const parts = token.value.split('|');
    const level = parseInt(parts[0], 10) || 1;
    const rawText = parts.slice(1).join('|');
    const children = this.parseInline(rawText, token.line, token.column);

    return {
      type: 'Heading',
      level,
      children,
      rawText,
      line: token.line,
      column: token.column,
    };
  }

  private parseCodeBlock(): MFCodeBlock {
    const startToken = this.advance(); // CodeBlockStart
    const language = startToken.value;
    const contentToken = this.expect(TokenType.CodeBlockContent);
    const content = contentToken.value;
    this.expect(TokenType.CodeBlockEnd); // CodeBlockEnd

    return {
      type: 'CodeBlock',
      language,
      value: content,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseBlockquote(): MFBlockquote {
    const token = this.advance();
    const children = this.parseInline(token.value, token.line, token.column);

    return {
      type: 'Blockquote',
      children,
      line: token.line,
      column: token.column,
    };
  }

  private parseHR(): MFHR {
    const token = this.advance();
    return {
      type: 'HR',
      line: token.line,
      column: token.column,
    };
  }

  private parseList(): MFList {
    const firstToken = this.current();
    const items: MFListItem[] = [];
    let ordered = false;

    while (this.pos < this.tokens.length && this.current().type === TokenType.ListItem) {
      const token = this.advance();
      const content = token.value;

      // Check for ordered list markers (1. 2. 3. etc.)
      if (/^\d+\.\s/.test(content)) {
        ordered = true;
      }

      const children = this.parseInline(content.replace(/^\d+\.\s/, '').replace(/^[-*+]\s/, ''), token.line, token.column);

      items.push({
        type: 'ListItem',
        children,
        line: token.line,
        column: token.column,
      });
    }

    return {
      type: 'List',
      ordered,
      children: items,
      line: firstToken.line,
      column: firstToken.column,
    };
  }

  private parseTable(): MFTable {
    const token = this.advance();
    const lines = token.value.split('\n').filter((l) => l.trim());

    if (lines.length === 0) {
      return {
        type: 'Table',
        header: [],
        rows: [],
        align: [],
        line: token.line,
        column: token.column,
      };
    }

    const parseRow = (line: string): MFTableCell[] => {
      const cells = line.split('|').filter((c) => c.trim() !== '');
      return cells.map((cell, idx) => ({
        type: 'TableCell' as const,
        children: this.parseInline(cell.trim(), token.line, token.column + idx),
        isHeader: false,
        line: token.line,
        column: token.column,
      }));
    };

    // First row is header
    const headerCells = parseRow(lines[0]);
    headerCells.forEach((c) => (c.isHeader = true));

    // Second row might be separator
    let startIdx = 1;
    const align: (string | null)[] = [];
    if (lines.length > 1 && /^[\s|:-]+$/.test(lines[1])) {
      const separators = lines[1].split('|').filter((s) => s.trim() !== '');
      for (const sep of separators) {
        const trimmed = sep.trim();
        if (trimmed.startsWith(':') && trimmed.endsWith(':')) {
          align.push('center');
        } else if (trimmed.endsWith(':')) {
          align.push('right');
        } else if (trimmed.startsWith(':')) {
          align.push('left');
        } else {
          align.push(null);
        }
      }
      startIdx = 2;
    } else {
      for (let i = 0; i < headerCells.length; i++) {
        align.push(null);
      }
    }

    const rows: MFTableCell[][] = [];
    for (let i = startIdx; i < lines.length; i++) {
      rows.push(parseRow(lines[i]));
    }

    return {
      type: 'Table',
      header: headerCells,
      rows,
      align,
      line: token.line,
      column: token.column,
    };
  }

  private parseFunctionCall(): MFFunctionCall {
    const token = this.advance();
    const data = JSON.parse(token.value);

    let body: MFASTNode[] | undefined;
    if (data.body) {
      // Parse the body content recursively
      const bodyTokens = tokenize(data.body);
      const bodyParser = new Parser(bodyTokens);
      const bodyDoc = bodyParser.parse();
      body = bodyDoc.children;
    }

    return {
      type: 'FunctionCall',
      name: data.name,
      args: data.args || [],
      body,
      rawBody: data.body || undefined,
      line: token.line,
      column: token.column,
    };
  }

  private parseVariableDef(): MFVariableDef {
    const token = this.advance();
    const parts = token.value.split('|');
    const name = parts[0].trim();
    const value = parts.slice(1).join('|').trim();

    return {
      type: 'VariableDef',
      name,
      value,
      line: token.line,
      column: token.column,
    };
  }

  private parseVariableRef(): MFVariableRef {
    const token = this.advance();
    return {
      type: 'VariableRef',
      name: token.value,
      line: token.line,
      column: token.column,
    };
  }

  private parseConditional(): MFConditional {
    const token = this.advance();
    const data = JSON.parse(token.value);

    const thenTokens = tokenize(data.thenBody);
    const thenParser = new Parser(thenTokens);
    const thenBody = thenParser.parse().children;

    let elseBody: MFASTNode[] | undefined;
    if (data.elseBody) {
      const elseTokens = tokenize(data.elseBody);
      const elseParser = new Parser(elseTokens);
      elseBody = elseParser.parse().children;
    }

    return {
      type: 'Conditional',
      condition: data.condition,
      thenBody,
      elseBody,
      line: token.line,
      column: token.column,
    };
  }

  private parseLoop(): MFLoop {
    const token = this.advance();
    const data = JSON.parse(token.value);

    const bodyTokens = tokenize(data.body);
    const bodyParser = new Parser(bodyTokens);
    const body = bodyParser.parse().children;

    return {
      type: 'Loop',
      variable: data.variable,
      collection: data.collection,
      body,
      line: token.line,
      column: token.column,
    };
  }

  private parseMathInline(): MFMathInline {
    const token = this.advance();
    return {
      type: 'MathInline',
      expression: token.value,
      line: token.line,
      column: token.column,
    };
  }

  private parseMathBlock(): MFMathBlock {
    const token = this.advance();
    return {
      type: 'MathBlock',
      expression: token.value,
      line: token.line,
      column: token.column,
    };
  }

  private parseToc(): MFToc {
    const token = this.advance();
    let maxDepth: number | undefined;
    if (token.value) {
      const depth = parseInt(token.value, 10);
      if (!isNaN(depth) && depth >= 1 && depth <= 6) {
        maxDepth = depth;
      }
    }
    return {
      type: 'Toc',
      maxDepth,
      line: token.line,
      column: token.column,
    };
  }

  private parsePageBreak(): MFPageBreak {
    const token = this.advance();
    return {
      type: 'PageBreak',
      line: token.line,
      column: token.column,
    };
  }

  private parseCallout(): MFCallout {
    const token = this.advance();
    const parts = token.value.split(/\s+/);
    const calloutType = parts[0] || 'info';
    const title = parts.slice(1).join(' ') || undefined;

    return {
      type: 'Callout',
      calloutType,
      title,
      children: [],
      line: token.line,
      column: token.column,
    };
  }

  private parseComment(): MFComment {
    const token = this.advance();
    return {
      type: 'Comment',
      value: token.value,
      line: token.line,
      column: token.column,
    };
  }

  private parseHTML(): MFHTML {
    const token = this.advance();
    return {
      type: 'HTML',
      value: token.value,
      line: token.line,
      column: token.column,
    };
  }

  private parseImage(): MFImage {
    const token = this.advance();
    const parts = token.value.split('|');
    const alt = parts[0] || '';
    const src = parts[1] || '';

    return {
      type: 'Image',
      src,
      alt,
      line: token.line,
      column: token.column,
    };
  }

  private parseParagraph(): MFParagraph | null {
    const children: MFASTNode[] = [];
    const startToken = this.current();

    // Collect all inline tokens for this paragraph
    while (this.pos < this.tokens.length) {
      const token = this.current();
      if (this.isBlockToken(token.type)) {
        break;
      }
      this.advance();

      switch (token.type) {
        case TokenType.Text:
          children.push({
            type: 'Text',
            value: token.value,
            line: token.line,
            column: token.column,
          } as MFText);
          break;
        case TokenType.Bold:
          children.push({
            type: 'Bold',
            children: this.parseInline(token.value, token.line, token.column),
            line: token.line,
            column: token.column,
          } as MFBold);
          break;
        case TokenType.Italic:
          children.push({
            type: 'Italic',
            children: this.parseInline(token.value, token.line, token.column),
            line: token.line,
            column: token.column,
          } as MFItalic);
          break;
        case TokenType.Code:
          children.push({
            type: 'Code',
            value: token.value,
            line: token.line,
            column: token.column,
          } as MFCode);
          break;
        case TokenType.Link:
          children.push(this.parseLinkToken(token));
          break;
        case TokenType.MathInline:
          children.push({
            type: 'MathInline',
            expression: token.value,
            line: token.line,
            column: token.column,
          } as MFMathInline);
          break;
        case TokenType.VariableRef:
          children.push({
            type: 'VariableRef',
            name: token.value,
            line: token.line,
            column: token.column,
          } as MFVariableRef);
          break;
        case TokenType.Strikethrough:
          children.push({
            type: 'Strikethrough',
            children: this.parseInline(token.value, token.line, token.column),
            line: token.line,
            column: token.column,
          } as MFStrikethrough);
          break;
        case TokenType.Image:
          children.push(this.parseImageToken(token));
          break;
        default:
          break;
      }
    }

    if (children.length === 0) {
      return null;
    }

    return {
      type: 'Paragraph',
      children,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseLinkToken(token: MFToken): MFLink {
    const parts = token.value.split('|');
    const text = parts[0] || '';
    const href = parts[1] || '';

    return {
      type: 'Link',
      href,
      children: this.parseInline(text, token.line, token.column),
      line: token.line,
      column: token.column,
    };
  }

  private parseImageToken(token: MFToken): MFImage {
    const parts = token.value.split('|');
    const alt = parts[0] || '';
    const src = parts[1] || '';

    return {
      type: 'Image',
      src,
      alt,
      line: token.line,
      column: token.column,
    };
  }

  /** Parse inline content from a raw string */
  private parseInline(text: string, line: number, column: number): MFASTNode[] {
    const nodes: MFASTNode[] = [];
    if (!text) return nodes;

    // Process inline markdown: bold, italic, code, links, images, math, variable refs
    let remaining = text;
    let currentLine = line;
    let currentCol = column;

    while (remaining.length > 0) {
      // Bold: **text**
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        nodes.push({
          type: 'Bold',
          children: [{ type: 'Text' as const, value: boldMatch[1], line: currentLine, column: currentCol } as MFText],
          line: currentLine,
          column: currentCol,
        } as MFBold);
        remaining = remaining.substring(boldMatch[0].length);
        currentCol += boldMatch[0].length;
        continue;
      }

      // Italic: *text*
      const italicMatch = remaining.match(/^\*([^*]+?)\*/);
      if (italicMatch) {
        nodes.push({
          type: 'Italic',
          children: [{ type: 'Text' as const, value: italicMatch[1], line: currentLine, column: currentCol } as MFText],
          line: currentLine,
          column: currentCol,
        } as MFItalic);
        remaining = remaining.substring(italicMatch[0].length);
        currentCol += italicMatch[0].length;
        continue;
      }

      // Inline code: `text`
      const codeMatch = remaining.match(/^`([^`]+?)`/);
      if (codeMatch) {
        nodes.push({
          type: 'Code',
          value: codeMatch[1],
          line: currentLine,
          column: currentCol,
        } as MFCode);
        remaining = remaining.substring(codeMatch[0].length);
        currentCol += codeMatch[0].length;
        continue;
      }

      // Strikethrough: ~~text~~
      const strikeMatch = remaining.match(/^~~(.+?)~~/);
      if (strikeMatch) {
        nodes.push({
          type: 'Strikethrough',
          children: [{ type: 'Text' as const, value: strikeMatch[1], line: currentLine, column: currentCol } as MFText],
          line: currentLine,
          column: currentCol,
        } as MFStrikethrough);
        remaining = remaining.substring(strikeMatch[0].length);
        currentCol += strikeMatch[0].length;
        continue;
      }

      // Image: ![alt](src)
      const imgMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      if (imgMatch) {
        nodes.push({
          type: 'Image',
          alt: imgMatch[1],
          src: imgMatch[2],
          line: currentLine,
          column: currentCol,
        } as MFImage);
        remaining = remaining.substring(imgMatch[0].length);
        currentCol += imgMatch[0].length;
        continue;
      }

      // Link: [text](href)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        nodes.push({
          type: 'Link',
          href: linkMatch[2],
          children: [{ type: 'Text' as const, value: linkMatch[1], line: currentLine, column: currentCol } as MFText],
          line: currentLine,
          column: currentCol,
        } as MFLink);
        remaining = remaining.substring(linkMatch[0].length);
        currentCol += linkMatch[0].length;
        continue;
      }

      // Inline math: $expression$
      const mathMatch = remaining.match(/^\$([^$\n]+?)\$/);
      if (mathMatch) {
        nodes.push({
          type: 'MathInline',
          expression: mathMatch[1],
          line: currentLine,
          column: currentCol,
        } as MFMathInline);
        remaining = remaining.substring(mathMatch[0].length);
        currentCol += mathMatch[0].length;
        continue;
      }

      // Variable reference: {variable}
      const varMatch = remaining.match(/^\{([a-zA-Z_][a-zA-Z0-9_]*)\}/);
      if (varMatch) {
        nodes.push({
          type: 'VariableRef',
          name: varMatch[1],
          line: currentLine,
          column: currentCol,
        } as MFVariableRef);
        remaining = remaining.substring(varMatch[0].length);
        currentCol += varMatch[0].length;
        continue;
      }

      // Plain text: consume until next special pattern
      const nextSpecial = remaining.search(/\*\*|\*|`|~~|!\[|\[|\$|\{|\.page\b|\.callout\b|\.columns\b|\.grid\b|\.box\b|\.align\b|\.color\b|\.fontsize\b|\.set\b|\.if\b|\.for\b|\.math\b|\.counter\b|\.timestamp\b|\.tabs\b|\.accordion\b|\.mermaid\b|\.badge\b|\.progress\b|\.toc\b|\.include\b/);
      if (nextSpecial === 0) {
        // Edge case: consume one character and continue
        nodes.push({
          type: 'Text',
          value: remaining[0],
          line: currentLine,
          column: currentCol,
        } as MFText);
        remaining = remaining.substring(1);
        currentCol++;
      } else if (nextSpecial > 0) {
        nodes.push({
          type: 'Text',
          value: remaining.substring(0, nextSpecial),
          line: currentLine,
          column: currentCol,
        } as MFText);
        remaining = remaining.substring(nextSpecial);
        currentCol += nextSpecial;
      } else {
        // No more special patterns, consume rest as text
        if (remaining.length > 0) {
          nodes.push({
            type: 'Text',
            value: remaining,
            line: currentLine,
            column: currentCol,
          } as MFText);
        }
        remaining = '';
      }
    }

    return nodes;
  }

  /** Check if a token type represents a block-level element */
  private isBlockToken(type: TokenType): boolean {
    return [
      TokenType.Heading,
      TokenType.CodeBlockStart,
      TokenType.Blockquote,
      TokenType.HR,
      TokenType.ListItem,
      TokenType.Table,
      TokenType.FunctionCall,
      TokenType.VariableDef,
      TokenType.Conditional,
      TokenType.Loop,
      TokenType.MathBlock,
      TokenType.Toc,
      TokenType.PageBreak,
      TokenType.Callout,
      TokenType.EOF,
    ].includes(type);
  }
}

/**
 * Parse a MarkFlow-Pro source string into an AST.
 *
 * @param source - The MarkFlow-Pro source text
 * @returns The document AST
 */
export function parse(source: string): MFDocument {
  const tokens = tokenize(source);
  const parser = new Parser(tokens);
  return parser.parse();
}
