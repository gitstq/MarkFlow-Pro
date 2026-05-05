/**
 * MarkFlow-Pro Evaluator
 *
 * Walks the AST and evaluates function calls, variable references,
 * conditionals, and loops. Returns a new AST with all dynamic
 * constructs resolved to their computed values.
 */

import {
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
} from '../parser/types';
import { VariableScope, MFValue } from './scope';
import { registerBuiltins, getBuiltinFunction } from './builtins';

/** Options for the evaluator */
export interface EvaluateOptions {
  /** Custom variables to inject into the root scope */
  variables?: Record<string, MFValue>;
  /** Base directory for resolving file includes */
  baseDir?: string;
}

/** Evaluator class that processes an AST and resolves dynamic constructs */
export class Evaluator {
  private scope: VariableScope;
  private baseDir: string;

  constructor(options: EvaluateOptions = {}) {
    this.scope = new VariableScope();
    this.baseDir = options.baseDir || process.cwd();

    // Register built-in functions
    registerBuiltins(this.scope);

    // Inject custom variables
    if (options.variables) {
      for (const [key, value] of Object.entries(options.variables)) {
        this.scope.set(key, value);
      }
    }
  }

  /**
   * Evaluate a document AST and return the resolved AST.
   *
   * @param ast - The document AST to evaluate
   * @returns The evaluated document AST
   */
  evaluate(ast: MFDocument): MFDocument {
    const children = this.evaluateNodes(ast.children);
    return {
      ...ast,
      children,
    };
  }

  /**
   * Evaluate a list of AST nodes.
   *
   * @param nodes - Array of AST nodes
   * @returns Array of evaluated AST nodes
   */
  evaluateNodes(nodes: MFASTNode[]): MFASTNode[] {
    const result: MFASTNode[] = [];
    for (const node of nodes) {
      const evaluated = this.evaluateNode(node);
      if (evaluated) {
        if (Array.isArray(evaluated)) {
          result.push(...evaluated);
        } else {
          result.push(evaluated);
        }
      }
    }
    return result;
  }

  /**
   * Evaluate a single AST node.
   *
   * @param node - The AST node to evaluate
   * @returns The evaluated node(s), or null if the node should be removed
   */
  evaluateNode(node: MFASTNode): MFASTNode | MFASTNode[] | null {
    switch (node.type) {
      case 'Document':
        return this.evaluate(node as MFDocument);

      case 'Heading':
        return this.evaluateHeading(node as MFHeading);

      case 'Paragraph':
        return this.evaluateParagraph(node as MFParagraph);

      case 'Text':
        return this.evaluateText(node as MFText);

      case 'Bold':
        return this.evaluateBold(node as MFBold);

      case 'Italic':
        return this.evaluateItalic(node as MFItalic);

      case 'Code':
        return node;

      case 'CodeBlock':
        return this.evaluateCodeBlock(node as MFCodeBlock);

      case 'List':
        return this.evaluateList(node as MFList);

      case 'ListItem':
        return this.evaluateListItem(node as MFListItem);

      case 'Table':
        return this.evaluateTable(node as MFTable);

      case 'TableCell':
        return this.evaluateTableCell(node as MFTableCell);

      case 'Image':
        return node;

      case 'Link':
        return this.evaluateLink(node as MFLink);

      case 'Blockquote':
        return this.evaluateBlockquote(node as MFBlockquote);

      case 'HR':
        return node;

      case 'FunctionCall':
        return this.evaluateFunctionCall(node as MFFunctionCall);

      case 'VariableDef':
        return this.evaluateVariableDef(node as MFVariableDef);

      case 'VariableRef':
        return this.evaluateVariableRef(node as MFVariableRef);

      case 'Conditional':
        return this.evaluateConditional(node as MFConditional);

      case 'Loop':
        return this.evaluateLoop(node as MFLoop);

      case 'MathInline':
        return node;

      case 'MathBlock':
        return node;

      case 'Toc':
        return node;

      case 'Footnote':
        return node;

      case 'FootnoteRef':
        return node;

      case 'PageBreak':
        return node;

      case 'Callout':
        return this.evaluateCallout(node as MFCallout);

      case 'Comment':
        return null; // Comments are stripped during evaluation

      case 'HTML':
        return this.evaluateHTML(node as MFHTML);

      case 'Strikethrough':
        return this.evaluateStrikethrough(node as MFStrikethrough);

      case 'SoftBreak':
        return node;

      default:
        return node;
    }
  }

  private evaluateHeading(node: MFHeading): MFHeading {
    return {
      ...node,
      children: this.evaluateNodes(node.children),
    };
  }

  private evaluateParagraph(node: MFParagraph): MFParagraph {
    return {
      ...node,
      children: this.evaluateNodes(node.children),
    };
  }

  private evaluateText(node: MFText): MFText {
    const resolved = this.scope.resolveReferences(node.value);
    return {
      ...node,
      value: resolved,
    };
  }

  private evaluateBold(node: MFBold): MFBold {
    return {
      ...node,
      children: this.evaluateNodes(node.children),
    };
  }

  private evaluateItalic(node: MFItalic): MFItalic {
    return {
      ...node,
      children: this.evaluateNodes(node.children),
    };
  }

  private evaluateCodeBlock(node: MFCodeBlock): MFCodeBlock {
    const resolved = this.scope.resolveReferences(node.value);
    return {
      ...node,
      value: resolved,
    };
  }

  private evaluateList(node: MFList): MFList {
    return {
      ...node,
      children: node.children.map((item) => this.evaluateListItem(item) as MFListItem),
    };
  }

  private evaluateListItem(node: MFListItem): MFListItem {
    return {
      ...node,
      children: this.evaluateNodes(node.children),
    };
  }

  private evaluateTable(node: MFTable): MFTable {
    return {
      ...node,
      header: node.header.map((cell) => this.evaluateTableCell(cell) as MFTableCell),
      rows: node.rows.map((row) => row.map((cell) => this.evaluateTableCell(cell) as MFTableCell)),
    };
  }

  private evaluateTableCell(node: MFTableCell): MFTableCell {
    return {
      ...node,
      children: this.evaluateNodes(node.children),
    };
  }

  private evaluateLink(node: MFLink): MFLink {
    return {
      ...node,
      href: this.scope.resolveReferences(node.href),
      children: this.evaluateNodes(node.children),
    };
  }

  private evaluateBlockquote(node: MFBlockquote): MFBlockquote {
    return {
      ...node,
      children: this.evaluateNodes(node.children),
    };
  }

  private evaluateFunctionCall(node: MFFunctionCall): MFASTNode | MFASTNode[] | null {
    const func = getBuiltinFunction(node.name, this.scope);
    if (func) {
      const bodyStr = node.rawBody || '';
      const result = func(node.args, bodyStr, this.scope);

      if (typeof result === 'string') {
        // If the function returned a string, parse it as a raw HTML node
        return {
          type: 'HTML',
          value: result,
          line: node.line,
          column: node.column,
        } as MFHTML;
      }

      if (Array.isArray(result)) {
        return result as MFASTNode[];
      }

      return result as MFASTNode;
    }

    // Unknown function: return as-is
    return node;
  }

  private evaluateVariableDef(node: MFVariableDef): null {
    const resolvedValue = this.scope.resolveReferences(node.value);
    this.scope.set(node.name, resolvedValue);
    return null; // Variable definitions don't produce output
  }

  private evaluateVariableRef(node: MFVariableRef): MFText {
    const value = this.scope.get(node.name);
    const stringValue = value !== undefined ? String(value) : `{${node.name}}`;
    return {
      type: 'Text',
      value: stringValue,
      line: node.line,
      column: node.column,
    };
  }

  private evaluateConditional(node: MFConditional): MFASTNode | MFASTNode[] | null {
    const conditionResult = this.scope.evaluateCondition(node.condition);
    if (conditionResult) {
      return this.evaluateNodes(node.thenBody);
    } else if (node.elseBody) {
      return this.evaluateNodes(node.elseBody);
    }
    return null;
  }

  private evaluateLoop(node: MFLoop): MFASTNode[] {
    const result: MFASTNode[] = [];
    const collectionStr = this.scope.resolveReferences(node.collection);
    const items = collectionStr.split(',').map((item) => item.trim()).filter((item) => item.length > 0);

    for (const item of items) {
      const childScope = this.scope.pushChild();
      childScope.set(node.variable, item);
      const evaluator = new EvaluatorWithScope(childScope, this.baseDir);
      const bodyResult = evaluator.evaluateNodes(node.body);
      result.push(...bodyResult);
    }

    return result;
  }

  private evaluateCallout(node: MFCallout): MFCallout {
    return {
      ...node,
      title: node.title ? this.scope.resolveReferences(node.title) : undefined,
      children: this.evaluateNodes(node.children),
    };
  }

  private evaluateHTML(node: MFHTML): MFHTML {
    return {
      ...node,
      value: this.scope.resolveReferences(node.value),
    };
  }

  private evaluateStrikethrough(node: MFStrikethrough): MFStrikethrough {
    return {
      ...node,
      children: this.evaluateNodes(node.children),
    };
  }
}

/** Internal evaluator that uses an existing scope */
class EvaluatorWithScope extends Evaluator {
  constructor(scope: VariableScope, baseDir: string) {
    super({ baseDir });
    (this as any).scope = scope;
  }
}

/**
 * Evaluate a MarkFlow-Pro AST document.
 *
 * @param ast - The document AST to evaluate
 * @param options - Evaluation options
 * @returns The evaluated document AST
 */
export function evaluate(ast: MFDocument, options: EvaluateOptions = {}): MFDocument {
  const evaluator = new Evaluator(options);
  return evaluator.evaluate(ast);
}
