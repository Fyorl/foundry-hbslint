/**
 * @import { AST } from '@handlebars/parser'
 */

import { getRawBetween } from "../utils.mjs";

/* -------------------------------------------- */

/**
 * @typedef Violation
 * @property {string} rule     The rule name that produced this violation.
 * @property {string} message  Human-readable description of the violation.
 * @property {number} line     1-based line number.
 * @property {number} column   0-based column number.
 */

/* -------------------------------------------- */

/**
 * @typedef RuleMeta
 * @property {string} name  The rule identifier used in config files and violation reports.
 */

/* -------------------------------------------- */

/**
 * @callback NodeListener
 * @param {object} node
 * @returns {void}
 */

/* -------------------------------------------- */

/**
 * Recursively walk an HBS AST node and dispatch each node to the matching listener.
 * Skips `loc` to avoid traversing source position objects.
 * @param {object} node
 * @param {Record<string, NodeListener>} listeners
 */
/**
 * Base class for hbslint rules. Subclasses must define a static meta property and implement _listeners().
 * The static rule() method returns the rule function used by the linter registry.
 */
export class BaseRule {

  /**
   * @param {string} source
   * @param {Record<string, unknown>} options
   */
  constructor(source, options) {
    this.#source = source;
    this.#options = options;
  }

  /* -------------------------------------------- */

  /**
   * Return the rule function (ast, source, options) -> Violation[] for use in the rule registry.
   * @returns {(ast: AST.Program, source: string, options: Record<string, unknown>) => Violation[]}
   */
  static rule() {
    return (ast, source, options) => {
      const instance = new this(source, options);
      instance._check(ast);
      return instance.#violations;
    };
  }

  /* -------------------------------------------- */

  /**
   * @type {Record<string, unknown>}
   */
  #options;

  /**
   * @type {string}
   */
  #source;

  /**
   * @type {Violation[]}
   */
  #violations = [];

  /* -------------------------------------------- */

  /**
   * The rule options resolved from the user config.
   * @type {Record<string, unknown>}
   */
  get options() {
    return this.#options;
  }

  /* -------------------------------------------- */

  /**
   * The raw template source being linted.
   * @type {string}
   */
  get source() {
    return this.#source;
  }

  /* -------------------------------------------- */

  /**
   * Walk the AST and dispatch to listeners returned by _listeners().
   * Subclasses may override for rules that require depth-aware or non-visitor traversal.
   * @param {AST.Program} ast
   * @protected
   */
  _check(ast) {
    walk(ast, this._listeners());
  }

  /* -------------------------------------------- */

  /**
   * Return the AST listener map. Must be implemented by subclasses (unless _check is overridden).
   * @returns {Record<string, NodeListener>}
   * @abstract
   * @protected
   */
  _listeners() {
    throw new Error(`${this.constructor.name} must implement _listeners()`);
  }

  /* -------------------------------------------- */

  /**
   * Return the raw source text spanning the full loc range of a node.
   * @param {AST.BaseNode} node
   * @returns {string}
   */
  rawOf(node) {
    return getRawBetween(this.source, node.loc.start, node.loc.end);
  }

  /* -------------------------------------------- */

  /**
   * Record a violation at the given node or location.
   * @param {string} message
   * @param {AST.BaseNode|{ line: number, column: number }} nodeOrLoc
   */
  report(message, nodeOrLoc) {
    const loc = nodeOrLoc.loc?.start ?? nodeOrLoc;
    this.#violations.push({
      message,
      column: loc.column,
      line: loc.line,
      rule: this.constructor.meta.name
    });
  }

}

/* -------------------------------------------- */

/**
 * Recursively walk an HBS AST node and dispatch each node to the matching listener.
 * Skips `loc` to avoid traversing source position objects.
 * @param {object} node
 * @param {Record<string, NodeListener>} listeners
 */
function walk(node, listeners) {
  if ( !node || (typeof node.type !== "string") ) return;
  listeners[node.type]?.(node);
  for ( const [key, val] of Object.entries(node) ) {
    if ( key === "loc" ) continue;
    if ( Array.isArray(val) ) {
      for ( const item of val ) walk(item, listeners);
    } else if ( val && (typeof val === "object") ) {
      walk(val, listeners);
    }
  }
}
