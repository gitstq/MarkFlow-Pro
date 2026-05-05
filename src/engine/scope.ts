/**
 * MarkFlow-Pro Variable Scope Management
 *
 * Implements a hierarchical scope chain for variable resolution.
 * Each scope has a parent, enabling lexical scoping with proper
 * variable shadowing and lookup semantics.
 */

/** Function signature type for callable values stored in scope */
export type MFCallable = (args: string[], body?: string, scope?: VariableScope) => string;

/** Value types that can be stored in scope */
export type MFValue = string | number | boolean | MFCallable | MFASTNode[] | undefined;

import { MFASTNode } from '../parser/types';

/** VariableScope class implementing hierarchical variable storage */
export class VariableScope {
  private variables: Map<string, MFValue>;
  private parentScope: VariableScope | null;
  private counters: Map<string, number>;

  /**
   * Create a new VariableScope.
   * @param parent - Optional parent scope for chained lookup
   */
  constructor(parent: VariableScope | null = null) {
    this.variables = new Map();
    this.parentScope = parent;
    this.counters = new Map();
  }

  /**
   * Get a variable value by name.
   * Walks up the scope chain if not found in current scope.
   *
   * @param name - Variable name
   * @returns The variable value, or undefined if not found
   */
  get(name: string): MFValue {
    if (this.variables.has(name)) {
      return this.variables.get(name);
    }
    if (this.parentScope) {
      return this.parentScope.get(name);
    }
    return undefined;
  }

  /**
   * Set a variable in the current scope.
   *
   * @param name - Variable name
   * @param value - Variable value
   */
  set(name: string, value: MFValue): void {
    this.variables.set(name, value);
  }

  /**
   * Check if a variable exists in the current scope or any parent scope.
   *
   * @param name - Variable name
   * @returns True if the variable exists
   */
  has(name: string): boolean {
    if (this.variables.has(name)) {
      return true;
    }
    if (this.parentScope) {
      return this.parentScope.has(name);
    }
    return false;
  }

  /**
   * Delete a variable from the current scope only.
   *
   * @param name - Variable name
   * @returns True if the variable was found and deleted
   */
  delete(name: string): boolean {
    return this.variables.delete(name);
  }

  /**
   * Create a new child scope with this scope as parent.
   *
   * @returns A new VariableScope with this scope as parent
   */
  pushChild(): VariableScope {
    return new VariableScope(this);
  }

  /**
   * Get the parent scope.
   *
   * @returns Parent scope or null if this is the root scope
   */
  getParent(): VariableScope | null {
    return this.parentScope;
  }

  /**
   * Get and increment a named counter.
   * Counters are scoped to the current scope.
   *
   * @param name - Counter name
   * @returns The current counter value (before increment)
   */
  getAndIncrementCounter(name: string): number {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + 1);
    return current + 1;
  }

  /**
   * Get a counter value without incrementing.
   *
   * @param name - Counter name
   * @returns Current counter value
   */
  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }

  /**
   * Reset a counter to zero.
   *
   * @param name - Counter name
   */
  resetCounter(name: string): void {
    this.counters.set(name, 0);
  }

  /**
   * Get all variable names in the current scope (not including parent scopes).
   *
   * @returns Array of variable names
   */
  keys(): string[] {
    return Array.from(this.variables.keys());
  }

  /**
   * Resolve a variable reference, replacing {variable} placeholders in a string.
   *
   * @param text - Text potentially containing {variable} references
   * @returns Text with all variable references resolved
   */
  resolveReferences(text: string): string {
    return text.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_match, name: string) => {
      const value = this.get(name);
      if (value === undefined) {
        return `{${name}}`;
      }
      return String(value);
    });
  }

  /**
   * Evaluate a simple condition expression.
   * Supports: variable existence, equality, comparison, boolean operators.
   *
   * @param condition - Condition expression string
   * @returns True if the condition evaluates to truthy
   */
  evaluateCondition(condition: string): boolean {
    const trimmed = condition.trim();

    // Boolean literals
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;

    // Equality check: name == value or name === value
    const eqMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*={2,3}\s*(.+)$/);
    if (eqMatch) {
      const varName = eqMatch[1];
      const expected = eqMatch[2].trim().replace(/^["']|["']$/g, '');
      const actual = this.get(varName);
      return String(actual) === expected;
    }

    // Inequality check: name != value or name !== value
    const neqMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*!={2,3}\s*(.+)$/);
    if (neqMatch) {
      const varName = neqMatch[1];
      const expected = neqMatch[2].trim().replace(/^["']|["']$/g, '');
      const actual = this.get(varName);
      return String(actual) !== expected;
    }

    // Greater than: name > value
    const gtMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*>\s*(.+)$/);
    if (gtMatch) {
      const varName = gtMatch[1];
      const numValue = parseFloat(gtMatch[2].trim());
      const actual = Number(this.get(varName));
      return !isNaN(actual) && !isNaN(numValue) && actual > numValue;
    }

    // Less than: name < value
    const ltMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*<\s*(.+)$/);
    if (ltMatch) {
      const varName = ltMatch[1];
      const numValue = parseFloat(ltMatch[2].trim());
      const actual = Number(this.get(varName));
      return !isNaN(actual) && !isNaN(numValue) && actual < numValue;
    }

    // Variable existence check (truthy)
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
      const value = this.get(trimmed);
      return value !== undefined && value !== '' && value !== 0 && value !== false;
    }

    // Default: resolve references and check truthiness
    const resolved = this.resolveReferences(trimmed);
    return resolved.length > 0 && resolved !== 'undefined' && resolved !== 'null' && resolved !== 'false' && resolved !== '0';
  }
}
