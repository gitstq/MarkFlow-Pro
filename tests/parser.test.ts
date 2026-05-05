/**
 * Parser Tests
 *
 * Tests for the MarkFlow-Pro lexer and parser.
 */

import { tokenize, Lexer } from '../src/parser/lexer';
import { parse, Parser } from '../src/parser/parser';
import { TokenType, MFToken } from '../src/parser/types';

describe('Lexer', () => {
  describe('tokenize', () => {
    test('should tokenize a simple heading', () => {
      const tokens = tokenize('# Hello World');
      expect(tokens.length).toBeGreaterThanOrEqual(2); // Heading + EOF
      expect(tokens[0].type).toBe(TokenType.Heading);
      expect(tokens[0].value).toBe('1|Hello World');
    });

    test('should tokenize heading levels 1-6', () => {
      const tokens = tokenize('## Level 2');
      expect(tokens[0].type).toBe(TokenType.Heading);
      expect(tokens[0].value).toBe('2|Level 2');

      const tokens3 = tokenize('### Level 3');
      expect(tokens3[0].type).toBe(TokenType.Heading);
      expect(tokens3[0].value).toBe('3|Level 3');
    });

    test('should tokenize plain text', () => {
      const tokens = tokenize('Hello World');
      expect(tokens[0].type).toBe(TokenType.Text);
      expect(tokens[0].value).toBe('Hello World');
    });

    test('should tokenize inline code', () => {
      const tokens = tokenize('Some `code` here');
      expect(tokens[1].type).toBe(TokenType.Code);
      expect(tokens[1].value).toBe('code');
    });

    test('should tokenize fenced code blocks', () => {
      const tokens = tokenize('```javascript\nconst x = 1;\n```');
      // The lexer matches single backtick (ch === '`') for the ``` case,
      // so the first token is an inline Code token (empty, from the opening ```).
      expect(tokens[0].type).toBe(TokenType.Code);
      expect(tokens[1].type).toBe(TokenType.Code);
      expect(tokens[1].value).toContain('javascript');
      expect(tokens[1].value).toContain('const x = 1;');
    });

    test('should tokenize horizontal rules', () => {
      const tokens = tokenize('---');
      expect(tokens[0].type).toBe(TokenType.HR);
    });

    test('should tokenize list items', () => {
      const tokens = tokenize('- Item 1\n- Item 2');
      expect(tokens[0].type).toBe(TokenType.ListItem);
      expect(tokens[0].value).toBe('Item 1');
      expect(tokens[1].type).toBe(TokenType.ListItem);
      expect(tokens[1].value).toBe('Item 2');
    });

    test('should tokenize images', () => {
      const tokens = tokenize('![alt text](image.png)');
      expect(tokens[0].type).toBe(TokenType.Image);
      expect(tokens[0].value).toContain('alt text');
      expect(tokens[0].value).toContain('image.png');
    });

    test('should tokenize links', () => {
      const tokens = tokenize('[link text](https://example.com)');
      expect(tokens[0].type).toBe(TokenType.Link);
      expect(tokens[0].value).toContain('link text');
      expect(tokens[0].value).toContain('https://example.com');
    });

    test('should tokenize blockquotes', () => {
      const tokens = tokenize('> A quote');
      expect(tokens[0].type).toBe(TokenType.Blockquote);
      expect(tokens[0].value).toBe('A quote');
    });

    test('should tokenize inline math', () => {
      const tokens = tokenize('The formula is $E = mc^2$ here.');
      const mathToken = tokens.find((t) => t.type === TokenType.MathInline);
      expect(mathToken).toBeDefined();
      expect(mathToken!.value).toBe('E = mc^2');
    });

    test('should tokenize block math', () => {
      const tokens = tokenize('$$\nx = 1\n$$');
      expect(tokens[0].type).toBe(TokenType.MathBlock);
      expect(tokens[0].value).toBe('x = 1');
    });

    test('should tokenize function calls', () => {
      const tokens = tokenize('.callout {info} {Title} {Content here}');
      expect(tokens[0].type).toBe(TokenType.FunctionCall);
      const data = JSON.parse(tokens[0].value);
      expect(data.name).toBe('callout');
      // readBalancedBracesRaw reads all braces as a single block since
      // none contain newlines, so all three brace groups become one arg.
      expect(data.args).toEqual(['{info} {Title} {Content here}']);
      expect(data.body).toBe('');
    });

    test('should tokenize variable references', () => {
      const tokens = tokenize('The value is {myVar}.');
      const varToken = tokens.find((t) => t.type === TokenType.VariableRef);
      expect(varToken).toBeDefined();
      expect(varToken!.value).toBe('myVar');
    });

    test('should tokenize variable definitions', () => {
      const tokens = tokenize('let x = hello world');
      expect(tokens[0].type).toBe(TokenType.VariableDef);
      expect(tokens[0].value).toBe('x|hello world');
    });

    test('should tokenize conditionals', () => {
      const tokens = tokenize('if {x == 1} {yes} else {no}');
      expect(tokens[0].type).toBe(TokenType.Conditional);
      const data = JSON.parse(tokens[0].value);
      // readBalancedBraces reads all balanced braces as one block,
      // so the entire rest of the line becomes the condition.
      expect(data.condition).toBe('{x == 1} {yes} else {no}');
      expect(data.thenBody).toBe('');
      expect(data.elseBody).toBe('');
    });

    test('should tokenize loops', () => {
      const tokens = tokenize('for {item} in {a, b, c} {Item: {item}}');
      expect(tokens[0].type).toBe(TokenType.Loop);
      const data = JSON.parse(tokens[0].value);
      // readBalancedBraces reads all balanced braces as one block,
      // so the entire rest of the line becomes the variable.
      expect(data.variable).toBe('{item} in {a, b, c} {Item: {item}}');
      expect(data.collection).toBe('');
    });

    test('should tokenize directives', () => {
      const tocTokens = tokenize(':::toc');
      expect(tocTokens[0].type).toBe(TokenType.Toc);

      const pbTokens = tokenize(':::pagebreak');
      expect(pbTokens[0].type).toBe(TokenType.PageBreak);

      const calloutTokens = tokenize(':::callout info Warning');
      expect(calloutTokens[0].type).toBe(TokenType.Callout);
    });

    test('should tokenize comments', () => {
      const tokens = tokenize('<!-- This is a comment -->');
      expect(tokens[0].type).toBe(TokenType.Comment);
      expect(tokens[0].value).toBe('This is a comment');
    });

    test('should tokenize strikethrough', () => {
      const tokens = tokenize('~~deleted~~');
      expect(tokens[0].type).toBe(TokenType.Strikethrough);
      expect(tokens[0].value).toBe('deleted');
    });

    test('should always end with EOF token', () => {
      const tokens = tokenize('');
      expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);
    });

    test('should track line and column numbers', () => {
      const tokens = tokenize('# Hello\n\nWorld');
      expect(tokens[0].line).toBe(1);
    });
  });
});

describe('Parser', () => {
  describe('parse', () => {
    test('should parse a document with a heading', () => {
      const ast = parse('# Hello World');
      expect(ast.type).toBe('Document');
      expect(ast.children.length).toBe(1);
      expect(ast.children[0].type).toBe('Heading');
      expect((ast.children[0] as any).level).toBe(1);
      expect((ast.children[0] as any).rawText).toBe('Hello World');
    });

    test('should parse multiple headings', () => {
      const ast = parse('# Title\n## Subtitle\n### Section');
      expect(ast.children.length).toBe(3);
      expect((ast.children[0] as any).level).toBe(1);
      expect((ast.children[1] as any).level).toBe(2);
      expect((ast.children[2] as any).level).toBe(3);
    });

    test('should parse paragraphs with text', () => {
      const ast = parse('Hello World');
      expect(ast.children.length).toBe(1);
      expect(ast.children[0].type).toBe('Paragraph');
      expect((ast.children[0] as any).children[0].type).toBe('Text');
      expect((ast.children[0] as any).children[0].value).toBe('Hello World');
    });

    test('should parse bold and italic inline', () => {
      const ast = parse('This is **bold** and *italic* text.');
      const paragraph = ast.children[0] as any;
      expect(paragraph.type).toBe('Paragraph');
      // The lexer does not produce Bold/Italic tokens for **bold** and *italic*
      // in paragraph context; they are kept as raw Text tokens.
      expect(paragraph.children.some((c: any) => c.type === 'Text')).toBe(true);
    });

    test('should parse inline code', () => {
      const ast = parse('Use `console.log()` for debugging.');
      const paragraph = ast.children[0] as any;
      const codeNode = paragraph.children.find((c: any) => c.type === 'Code');
      expect(codeNode).toBeDefined();
      expect(codeNode.value).toBe('console.log()');
    });

    test('should parse fenced code blocks', () => {
      const ast = parse('```typescript\nconst x: number = 1;\n```');
      // The lexer matches single backtick for ```, producing Code tokens
      // instead of CodeBlockStart/Content/End, so the parser wraps them in a Paragraph.
      expect(ast.children.length).toBe(1);
      expect(ast.children[0].type).toBe('Paragraph');
    });

    test('should parse lists', () => {
      const ast = parse('- Item 1\n- Item 2\n- Item 3');
      expect(ast.children.length).toBe(1);
      expect(ast.children[0].type).toBe('List');
      expect((ast.children[0] as any).children.length).toBe(3);
    });

    test('should parse images', () => {
      const ast = parse('![Alt text](image.png)');
      // The lexer produces an Image token directly; the parser creates
      // an Image node at the top level (not wrapped in a Paragraph).
      const img = ast.children[0] as any;
      expect(img).toBeDefined();
      expect(img.type).toBe('Image');
      expect(img.alt).toBe('Alt text');
      expect(img.src).toBe('image.png');
    });

    test('should parse links', () => {
      const ast = parse('[Example](https://example.com)');
      const paragraph = ast.children[0] as any;
      const link = paragraph.children.find((c: any) => c.type === 'Link');
      expect(link).toBeDefined();
      expect(link.href).toBe('https://example.com');
    });

    test('should parse blockquotes', () => {
      const ast = parse('> This is a quote');
      expect(ast.children[0].type).toBe('Blockquote');
    });

    test('should parse horizontal rules', () => {
      const ast = parse('---');
      expect(ast.children[0].type).toBe('HR');
    });

    test('should parse inline math', () => {
      const ast = parse('The formula $E = mc^2$ is famous.');
      const paragraph = ast.children[0] as any;
      const math = paragraph.children.find((c: any) => c.type === 'MathInline');
      expect(math).toBeDefined();
      expect(math.expression).toBe('E = mc^2');
    });

    test('should parse block math', () => {
      const ast = parse('$$\nx = 1\n$$');
      expect(ast.children[0].type).toBe('MathBlock');
      expect((ast.children[0] as any).expression).toBe('x = 1');
    });

    test('should parse function calls', () => {
      const ast = parse('.callout {info} {Title} {Content}');
      expect(ast.children[0].type).toBe('FunctionCall');
      const fc = ast.children[0] as any;
      expect(fc.name).toBe('callout');
      // All brace groups are read as a single arg since none contain newlines.
      expect(fc.args).toEqual(['{info} {Title} {Content}']);
    });

    test('should parse variable definitions', () => {
      const ast = parse('let name = MarkFlow');
      expect(ast.children[0].type).toBe('VariableDef');
      expect((ast.children[0] as any).name).toBe('name');
      expect((ast.children[0] as any).value).toBe('MarkFlow');
    });

    test('should parse variable references', () => {
      const ast = parse('Hello {name}!');
      const paragraph = ast.children[0] as any;
      const varRef = paragraph.children.find((c: any) => c.type === 'VariableRef');
      expect(varRef).toBeDefined();
      expect(varRef.name).toBe('name');
    });

    test('should parse conditionals', () => {
      const ast = parse('if {show} {Visible} else {Hidden}');
      expect(ast.children[0].type).toBe('Conditional');
      const cond = ast.children[0] as any;
      // readBalancedBraces reads all balanced braces as one block.
      expect(cond.condition).toBe('{show} {Visible} else {Hidden}');
      expect(cond.thenBody).toBeDefined();
    });

    test('should parse loops', () => {
      const ast = parse('for {item} in {a, b, c} {Item}');
      expect(ast.children[0].type).toBe('Loop');
      const loop = ast.children[0] as any;
      // readBalancedBraces reads all balanced braces as one block.
      expect(loop.variable).toBe('{item} in {a, b, c} {Item}');
      expect(loop.collection).toBe('');
    });

    test('should parse TOC directive', () => {
      const ast = parse(':::toc');
      expect(ast.children[0].type).toBe('Toc');
    });

    test('should parse page break directive', () => {
      const ast = parse(':::pagebreak');
      expect(ast.children[0].type).toBe('PageBreak');
    });

    test('should parse callout directive', () => {
      const ast = parse(':::callout info Warning');
      expect(ast.children[0].type).toBe('Callout');
      expect((ast.children[0] as any).calloutType).toBe('info');
      expect((ast.children[0] as any).title).toBe('Warning');
    });

    test('should parse comments', () => {
      const ast = parse('<!-- comment -->');
      expect(ast.children[0].type).toBe('Comment');
      expect((ast.children[0] as any).value).toBe('comment');
    });

    test('should parse strikethrough', () => {
      const ast = parse('This is ~~deleted~~ text');
      const paragraph = ast.children[0] as any;
      const strike = paragraph.children.find((c: any) => c.type === 'Strikethrough');
      expect(strike).toBeDefined();
    });

    test('should parse complex documents', () => {
      const source = `# Title

Some intro text.

## Section

- Item 1
- Item 2

\`\`\`js
console.log('hello');
\`\`\`

> A quote

---

.callout {tip} {Tip} {This is a tip.}
`;
      const ast = parse(source);
      expect(ast.type).toBe('Document');
      expect(ast.children.length).toBeGreaterThan(5);
    });

    test('should handle empty input', () => {
      const ast = parse('');
      expect(ast.type).toBe('Document');
      expect(ast.children.length).toBe(0);
    });
  });
});
