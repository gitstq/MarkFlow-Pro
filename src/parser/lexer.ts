/**
 * MarkFlow-Pro Lexer/Tokenizer
 *
 * Tokenizes extended Markdown source into a stream of tokens.
 * Supports standard Markdown tokens plus MarkFlow-specific extensions:
 * - Function calls: .functionName {arg} {arg} ... {body}
 * - Math expressions: $inline$ and $$block$$
 * - Variable references: {variable}
 * - Variable definitions: let x = value
 * - Directives: :::toc, :::pagebreak, :::callout
 * - Conditionals: if {condition} {body} else {body}
 * - Loops: for {var} in {collection} {body}
 */

import { MFToken, TokenType } from './types';

/** Lexer class for tokenizing MarkFlow-Pro source text */
export class Lexer {
  private source: string;
  private pos: number;
  private line: number;
  private column: number;
  private tokens: MFToken[];

  constructor(source: string) {
    this.source = source;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
  }

  /** Tokenize the entire source and return the list of tokens */
  public tokenize(): MFToken[] {
    const maxIterations = this.source.length * 10; // Safety limit
    let iterations = 0;
    while (this.pos < this.source.length && iterations < maxIterations) {
      iterations++;
      const prevPos = this.pos;
      this.skipWhitespaceAndNewlines();
      if (this.pos >= this.source.length) break;

      const ch = this.source[this.pos];

      if (ch === '#') {
        this.readHeading();
      } else if (ch === '```') {
        this.readCodeBlock();
      } else if (ch === '`') {
        this.readInlineCode();
      } else if (ch === '>' && this.isBlockquoteStart()) {
        this.readBlockquote();
      } else if (ch === '-' || ch === '*' || ch === '+') {
        if (this.isHR()) {
          this.readHR();
        } else if (this.isListItemStart()) {
          this.readListItem();
        } else {
          this.readText();
        }
      } else if (ch === '_' || ch === '_') {
        this.readText();
      } else if (ch === '!' && this.pos + 1 < this.source.length && this.source[this.pos + 1] === '[') {
        this.readImage();
      } else if (ch === '[') {
        this.readLink();
      } else if (ch === '|' && this.isTableStart()) {
        this.readTable();
      } else if (ch === '.' && this.isFunctionCallStart()) {
        this.readFunctionCall();
      } else if (ch === '$') {
        this.readMath();
      } else if (ch === '{' && this.isVariableRef()) {
        this.readVariableRef();
      } else if (this.matchKeyword('let ')) {
        this.readVariableDef();
      } else if (this.matchKeyword('if ')) {
        this.readConditional();
      } else if (this.matchKeyword('for ')) {
        this.readLoop();
      } else if (ch === ':' && this.matchKeyword(':::')) {
        this.readDirective();
      } else if (ch === '<' && this.isCommentStart()) {
        this.readComment();
      } else if (ch === '<' && this.isHTMLStart()) {
        this.readHTML();
      } else if (ch === '~' && this.pos + 1 < this.source.length && this.source[this.pos + 1] === '~') {
        this.readStrikethrough();
      } else {
        this.readText();
      }

      // Safety: if no progress was made, advance one character
      if (this.pos === prevPos) {
        this.advance();
      }
    }

    this.tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.line,
      column: this.column,
    });

    return this.tokens;
  }

  private peek(offset: number = 0): string {
    const idx = this.pos + offset;
    return idx < this.source.length ? this.source[idx] : '';
  }

  private advance(): string {
    const ch = this.source[this.pos];
    this.pos++;
    if (ch === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return ch;
  }

  private match(str: string): boolean {
    return this.source.substring(this.pos, this.pos + str.length) === str;
  }

  private matchKeyword(keyword: string): boolean {
    return this.source.substring(this.pos, this.pos + keyword.length) === keyword;
  }

  private makeToken(type: TokenType, value: string): MFToken {
    return {
      type,
      value,
      line: this.line,
      column: this.column,
    };
  }

  private skipWhitespaceAndNewlines(): void {
    while (this.pos < this.source.length && /\s/.test(this.source[this.pos])) {
      this.advance();
    }
  }

  private readUntilNewline(): string {
    let result = '';
    while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
      result += this.advance();
    }
    return result;
  }

  private readUntil(condition: (ch: string) => boolean): string {
    let result = '';
    while (this.pos < this.source.length && !condition(this.source[this.pos])) {
      result += this.advance();
    }
    return result;
  }

  private readBalancedBraces(): string {
    let depth = 0;
    let result = '';
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      if (ch === '{') {
        depth++;
        result += this.advance();
      } else if (ch === '}') {
        depth--;
        if (depth < 0) break;
        result += this.advance();
      } else {
        result += this.advance();
      }
    }
    // Consume closing brace
    if (this.pos < this.source.length && this.source[this.pos] === '}') {
      this.advance();
    }
    return result;
  }

  private readBalancedBracesRaw(): string {
    let depth = 0;
    let result = '';
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      if (ch === '{') {
        depth++;
        result += this.advance();
      } else if (ch === '}') {
        depth--;
        if (depth < 0) break;
        result += this.advance();
      } else if (ch === '\n') {
        result += this.advance();
      } else {
        result += this.advance();
      }
    }
    // Consume closing brace
    if (this.pos < this.source.length && this.source[this.pos] === '}') {
      this.advance();
    }
    return result;
  }

  private readHeading(): void {
    const startLine = this.line;
    const startCol = this.column;
    let level = 0;
    while (this.pos < this.source.length && this.source[this.pos] === '#') {
      level++;
      this.advance();
    }
    // Skip space after #
    if (this.pos < this.source.length && this.source[this.pos] === ' ') {
      this.advance();
    }
    const text = this.readUntilNewline().trim();
    this.tokens.push(this.makeToken(TokenType.Heading, `${level}|${text}`));
  }

  private readCodeBlock(): void {
    const startLine = this.line;
    const startCol = this.column;
    // Read opening ```
    while (this.pos < this.source.length && this.source[this.pos] === '`') {
      this.advance();
    }
    // Read language identifier
    let language = '';
    while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
      language += this.advance();
    }
    language = language.trim();
    if (this.pos < this.source.length) this.advance(); // skip newline

    this.tokens.push(this.makeToken(TokenType.CodeBlockStart, language));

    // Read code content until closing ```
    let content = '';
    while (this.pos < this.source.length) {
      if (this.match('```') && (this.pos + 3 >= this.source.length || this.source[this.pos + 3] === '\n')) {
        break;
      }
      content += this.advance();
    }

    this.tokens.push(this.makeToken(TokenType.CodeBlockContent, content));

    // Read closing ```
    while (this.pos < this.source.length && this.source[this.pos] === '`') {
      this.advance();
    }
    if (this.pos < this.source.length && this.source[this.pos] === '\n') {
      this.advance();
    }

    this.tokens.push(this.makeToken(TokenType.CodeBlockEnd, ''));
  }

  private readInlineCode(): void {
    this.advance(); // skip opening `
    let content = '';
    while (this.pos < this.source.length && this.source[this.pos] !== '`') {
      content += this.advance();
    }
    if (this.pos < this.source.length) this.advance(); // skip closing `
    this.tokens.push(this.makeToken(TokenType.Code, content));
  }

  private isBlockquoteStart(): boolean {
    return this.pos + 1 < this.source.length && this.source[this.pos + 1] === ' ';
  }

  private readBlockquote(): void {
    this.advance(); // skip >
    if (this.pos < this.source.length && this.source[this.pos] === ' ') {
      this.advance();
    }
    const content = this.readUntilNewline().trim();
    this.tokens.push(this.makeToken(TokenType.Blockquote, content));
  }

  private isHR(): boolean {
    const restOfLine = this.source.substring(this.pos).split('\n')[0];
    return /^(\*{3,}|-{3,}|_{3,})\s*$/.test(restOfLine);
  }

  private readHR(): void {
    const restOfLine = this.source.substring(this.pos).split('\n')[0];
    this.pos += restOfLine.length;
    if (this.pos < this.source.length && this.source[this.pos] === '\n') {
      this.advance();
    }
    this.tokens.push(this.makeToken(TokenType.HR, ''));
  }

  private isListItemStart(): boolean {
    const restOfLine = this.source.substring(this.pos).split('\n')[0];
    return /^[-*+]\s+/.test(restOfLine);
  }

  private readListItem(): void {
    this.advance(); // skip list marker
    if (this.pos < this.source.length && this.source[this.pos] === ' ') {
      this.advance();
    }
    const content = this.readUntilNewline().trim();
    this.tokens.push(this.makeToken(TokenType.ListItem, content));
  }

  private isTableStart(): boolean {
    // Check if this line looks like a table row
    const restOfLine = this.source.substring(this.pos).split('\n')[0];
    return /^\|(.+\|)+\s*$/.test(restOfLine.trim());
  }

  private readTable(): void {
    let content = '';
    while (this.pos < this.source.length) {
      const lineStart = this.pos;
      const line = this.source.substring(this.pos).split('\n')[0];
      if (!/^\s*\|/.test(line)) break;
      content += line + '\n';
      this.pos += line.length;
      if (this.pos < this.source.length && this.source[this.pos] === '\n') {
        this.advance();
      }
    }
    this.tokens.push(this.makeToken(TokenType.Table, content.trim()));
  }

  private readImage(): void {
    this.advance(); // skip !
    this.advance(); // skip [
    const alt = this.readUntil((ch) => ch === ']').trim();
    if (this.pos < this.source.length) this.advance(); // skip ]
    if (this.pos < this.source.length) this.advance(); // skip (
    const src = this.readUntil((ch) => ch === ')').trim();
    if (this.pos < this.source.length) this.advance(); // skip )
    this.tokens.push(this.makeToken(TokenType.Image, `${alt}|${src}`));
  }

  private readLink(): void {
    this.advance(); // skip [
    const text = this.readUntil((ch) => ch === ']').trim();
    if (this.pos < this.source.length) this.advance(); // skip ]
    if (this.pos < this.source.length) this.advance(); // skip (
    const href = this.readUntil((ch) => ch === ')').trim();
    if (this.pos < this.source.length) this.advance(); // skip )
    this.tokens.push(this.makeToken(TokenType.Link, `${text}|${href}`));
  }

  private isFunctionCallStart(): boolean {
    // .functionName followed by space or {
    const rest = this.source.substring(this.pos);
    return /^\.[a-zA-Z_][a-zA-Z0-9_]*[\s{]/.test(rest);
  }

  private readFunctionCall(): void {
    this.advance(); // skip .
    const name = this.readUntil((ch) => ch === ' ' || ch === '{' || ch === '\n').trim();

    const args: string[] = [];
    let body = '';

    // Read arguments in braces
    while (this.pos < this.source.length) {
      this.skipWhitespaceAndNewlines();
      if (this.pos >= this.source.length) break;
      if (this.source[this.pos] === '{') {
        // Check if this is the body (multi-line or last arg)
        const savedPos = this.pos;
        const savedLine = this.line;
        const savedCol = this.column;
        const content = this.readBalancedBracesRaw();
        // If content contains newlines, it's the body
        if (content.includes('\n')) {
          body = content;
          break;
        } else {
          args.push(content);
        }
      } else {
        break;
      }
    }

    // If no body was found with braces, check for remaining content on the same line
    if (!body && this.pos < this.source.length && this.source[this.pos] !== '\n') {
      const remaining = this.readUntilNewline().trim();
      if (remaining) {
        body = remaining;
      }
    }

    this.tokens.push(this.makeToken(TokenType.FunctionCall, JSON.stringify({ name, args, body })));
  }

  private readMath(): void {
    this.advance(); // skip first $
    if (this.pos < this.source.length && this.source[this.pos] === '$') {
      // Block math $$
      this.advance(); // skip second $
      let expression = '';
      while (this.pos < this.source.length) {
        if (this.source[this.pos] === '$' && this.pos + 1 < this.source.length && this.source[this.pos + 1] === '$') {
          break;
        }
        expression += this.advance();
      }
      if (this.pos < this.source.length) this.advance(); // skip $
      if (this.pos < this.source.length) this.advance(); // skip $
      this.tokens.push(this.makeToken(TokenType.MathBlock, expression.trim()));
    } else {
      // Inline math
      let expression = '';
      while (this.pos < this.source.length && this.source[this.pos] !== '$' && this.source[this.pos] !== '\n') {
        expression += this.advance();
      }
      if (this.pos < this.source.length && this.source[this.pos] === '$') {
        this.advance(); // skip closing $
      }
      this.tokens.push(this.makeToken(TokenType.MathInline, expression.trim()));
    }
  }

  private isVariableRef(): boolean {
    // {variable} - must be a simple identifier, not a function arg
    const rest = this.source.substring(this.pos);
    return /^\{[a-zA-Z_][a-zA-Z0-9_]*\}/.test(rest);
  }

  private readVariableRef(): void {
    this.advance(); // skip {
    const name = this.readUntil((ch) => ch === '}').trim();
    if (this.pos < this.source.length) this.advance(); // skip }
    this.tokens.push(this.makeToken(TokenType.VariableRef, name));
  }

  private readVariableDef(): void {
    // let x = value
    this.pos += 4; // skip 'let '
    this.column += 4;
    const name = this.readUntil((ch) => ch === '=').trim();
    if (this.pos < this.source.length) this.advance(); // skip =
    if (this.pos < this.source.length && this.source[this.pos] === ' ') this.advance(); // skip space
    const value = this.readUntilNewline().trim();
    this.tokens.push(this.makeToken(TokenType.VariableDef, `${name}|${value}`));
  }

  private readConditional(): void {
    // if {condition} {then} else {otherwise}
    this.pos += 3; // skip 'if '
    this.column += 3;
    this.skipWhitespaceAndNewlines();

    // Read condition
    const condition = this.readBalancedBraces().trim();
    this.skipWhitespaceAndNewlines();

    // Read then body
    const thenBody = this.readBalancedBracesRaw().trim();
    this.skipWhitespaceAndNewlines();

    // Check for else
    let elseBody = '';
    if (this.matchKeyword('else')) {
      this.pos += 4; // skip 'else'
      this.column += 4;
      this.skipWhitespaceAndNewlines();
      elseBody = this.readBalancedBracesRaw().trim();
    }

    this.tokens.push(this.makeToken(TokenType.Conditional, JSON.stringify({ condition, thenBody, elseBody })));
  }

  private readLoop(): void {
    // for {var} in {collection} {body}
    this.pos += 4; // skip 'for '
    this.column += 4;
    this.skipWhitespaceAndNewlines();

    // Read variable
    const variable = this.readBalancedBraces().trim();
    this.skipWhitespaceAndNewlines();

    // Skip 'in'
    if (this.matchKeyword('in')) {
      this.pos += 2;
      this.column += 2;
    }
    this.skipWhitespaceAndNewlines();

    // Read collection
    const collection = this.readBalancedBraces().trim();
    this.skipWhitespaceAndNewlines();

    // Read body
    const body = this.readBalancedBracesRaw().trim();

    this.tokens.push(this.makeToken(TokenType.Loop, JSON.stringify({ variable, collection, body })));
  }

  private readDirective(): void {
    // :::directive [args]
    this.pos += 3; // skip :::
    this.column += 3;
    const rest = this.readUntilNewline().trim();
    const parts = rest.split(/\s+/);
    const directive = parts[0];
    const args = parts.slice(1).join(' ');

    switch (directive) {
      case 'toc':
        this.tokens.push(this.makeToken(TokenType.Toc, args));
        break;
      case 'pagebreak':
        this.tokens.push(this.makeToken(TokenType.PageBreak, ''));
        break;
      case 'callout':
        this.tokens.push(this.makeToken(TokenType.Callout, args));
        break;
      default:
        // Unknown directive, treat as text
        this.tokens.push(this.makeToken(TokenType.Text, `:::${rest}`));
        break;
    }
  }

  private isCommentStart(): boolean {
    return this.source.substring(this.pos, this.pos + 4) === '<!--';
  }

  private readComment(): void {
    const endIdx = this.source.indexOf('-->', this.pos + 4);
    if (endIdx === -1) {
      const content = this.source.substring(this.pos + 4);
      this.pos = this.source.length;
      this.tokens.push(this.makeToken(TokenType.Comment, content.trim()));
    } else {
      const content = this.source.substring(this.pos + 4, endIdx).trim();
      this.pos = endIdx + 3;
      this.tokens.push(this.makeToken(TokenType.Comment, content));
    }
  }

  private isHTMLStart(): boolean {
    return /^<[a-zA-Z][a-zA-Z0-9]*[\s>\/]/.test(this.source.substring(this.pos));
  }

  private readHTML(): void {
    let content = '';
    let depth = 0;
    while (this.pos < this.source.length) {
      if (this.source[this.pos] === '<') {
        if (this.match('<!--')) {
          // Skip HTML comments
          const endIdx = this.source.indexOf('-->', this.pos + 4);
          if (endIdx !== -1) {
            content += this.source.substring(this.pos, endIdx + 3);
            this.pos = endIdx + 3;
            continue;
          }
        }
        const tagMatch = this.source.substring(this.pos).match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);
        if (tagMatch) {
          if (this.source[this.pos + 1] === '/') {
            depth--;
            if (depth < 0) {
              content += this.advance();
              continue;
            }
          } else {
            // Check if self-closing
            const tagEnd = this.source.indexOf('>', this.pos);
            if (tagEnd !== -1) {
              const tagContent = this.source.substring(this.pos, tagEnd + 1);
              if (!/\/>$/.test(tagContent)) {
                depth++;
              }
            }
          }
        }
      }
      content += this.advance();
      if (depth <= 0 && content.includes('>')) {
        // We've closed the initial tag
        const lastGt = content.lastIndexOf('>');
        if (lastGt >= 0 && depth <= 0) {
          // Check if there's more content after the closing tag
          const remaining = content.substring(lastGt + 1).trim();
          if (remaining && !remaining.startsWith('<')) {
            // Put back non-HTML content
            const extraLen = remaining.length;
            this.pos -= extraLen;
            content = content.substring(0, lastGt + 1);
          }
          break;
        }
      }
    }
    this.tokens.push(this.makeToken(TokenType.HTML, content.trim()));
  }

  private readStrikethrough(): void {
    this.advance(); // skip first ~
    this.advance(); // skip second ~
    let content = '';
    while (this.pos < this.source.length) {
      if (this.source[this.pos] === '~' && this.pos + 1 < this.source.length && this.source[this.pos + 1] === '~') {
        break;
      }
      content += this.advance();
    }
    if (this.pos < this.source.length) this.advance(); // skip ~
    if (this.pos < this.source.length) this.advance(); // skip ~
    this.tokens.push(this.makeToken(TokenType.Strikethrough, content.trim()));
  }

  private readText(): void {
    let content = '';
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      // Stop at special characters
      if (ch === '\n') {
        break;
      }
      if (ch === '#' && (this.pos === 0 || this.source[this.pos - 1] === '\n')) {
        break;
      }
      if (ch === '`' && (this.match('```') || (ch === '`' && this.pos + 1 < this.source.length && this.source[this.pos + 1] !== '`'))) {
        break;
      }
      if (ch === '.' && this.isFunctionCallStart()) {
        break;
      }
      if (ch === '$') {
        break;
      }
      if (ch === '{' && this.isVariableRef()) {
        break;
      }
      if (ch === ':' && this.matchKeyword(':::')) {
        break;
      }
      if (ch === '<' && (this.isCommentStart() || this.isHTMLStart())) {
        break;
      }
      if (ch === '!' && this.pos + 1 < this.source.length && this.source[this.pos + 1] === '[') {
        break;
      }
      if (ch === '|' && this.isTableStart()) {
        break;
      }
      if (ch === '~' && this.pos + 1 < this.source.length && this.source[this.pos + 1] === '~') {
        break;
      }
      // Check for markdown bold/italic markers at word boundaries
      if ((ch === '*' || ch === '_') && this.pos + 1 < this.source.length && (this.source[this.pos + 1] === ch || /\s/.test(this.source[this.pos - 1] || ''))) {
        // Check for bold (** or __)
        if (this.pos + 2 < this.source.length && this.source[this.pos + 1] === ch) {
          break;
        }
        // Check for italic
        if (/\s/.test(this.source[this.pos + 1] || '') || this.pos + 1 >= this.source.length) {
          content += this.advance();
          break;
        }
      }
      content += this.advance();
    }
    if (content.trim()) {
      this.tokens.push(this.makeToken(TokenType.Text, content));
    } else if (content.length > 0) {
      // Content was only whitespace; advance past it
      // (pos already advanced by the loop)
    }
    // Safety: if no progress was made, advance one character to prevent infinite loop
    if (content.length === 0 && this.pos < this.source.length) {
      this.advance();
    }
  }
}

/**
 * Tokenize a MarkFlow-Pro source string into tokens.
 *
 * @param source - The MarkFlow-Pro source text
 * @returns Array of tokens
 */
export function tokenize(source: string): MFToken[] {
  const lexer = new Lexer(source);
  return lexer.tokenize();
}
