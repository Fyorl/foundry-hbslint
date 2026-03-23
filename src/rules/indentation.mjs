/**
 * @import { AST } from '@handlebars/parser'
 * @import { RuleMeta } from './base.mjs'
 */

import { getLines } from "../utils.mjs";

import { BaseRule } from "./base.mjs";

/* -------------------------------------------- */

/**
 * Enforce consistent indentation of content inside block helpers.
 * Checks the leading whitespace of the source line each statement occupies, and also verifies close tag indentation
 * matches the corresponding open tag depth.
 */
class IndentationRule extends BaseRule {

  /**
   * @type {RuleMeta}
   */
  static meta = {
    name: "indentation"
  };

  /* -------------------------------------------- */

  /**
   * @type {string[]|null}
   */
  #lines = null;

  /* -------------------------------------------- */

  /**
   * The single indent unit string computed from options.
   * @type {string}
   */
  get #indent() {
    return this.options.style === "tab" ? "\t" : " ".repeat(this.options.size ?? 2);
  }

  /* -------------------------------------------- */

  /** @override */
  _check(ast) {
    this.#lines = Array.from(getLines(this.source));
    this.#walkBody(ast.body, 0);
  }

  /* -------------------------------------------- */

  /** @override */
  _listeners() {
    return {};
  }

  /* -------------------------------------------- */

  /**
   * Check that the close tag of a BlockStatement is at the same indentation depth as its open tag.
   * @param {AST.BlockStatement} node
   * @param {number} depth
   */
  #checkCloseTagIndent(node, depth) {
    const expected = this.#indent.repeat(depth);
    const lineText = this.#lines[node.loc.end.line - 1];
    const leading = lineText.match(/^(\s*)/)[1];
    if ( leading !== expected ) this.report(this.#message(expected, leading), { column: 0, line: node.loc.end.line });
  }

  /* -------------------------------------------- */

  /**
   * Check non-blank lines within a ContentStatement's value for correct leading whitespace.
   * @param {AST.ContentStatement} node
   * @param {number} depth
   */
  #checkContentLines(node, depth) {
    const expected = this.#indent.repeat(depth);
    let lineNum = node.loc.start.line;
    for ( const line of getLines(node.value) ) {
      if ( line.trim() ) {
        const leading = line.match(/^(\s*)/)[1];
        if ( leading !== expected ) this.report(this.#message(expected, leading), { column: 0, line: lineNum });
      }
      lineNum++;
    }
  }

  /* -------------------------------------------- */

  /**
   * Check that the source line a statement starts on has the expected leading whitespace.
   * @param {AST.BaseNode} node
   * @param {number} depth
   */
  #checkStatementIndent(node, depth) {
    const expected = this.#indent.repeat(depth);
    const lineText = this.#lines[node.loc.start.line - 1];
    const leading = lineText.match(/^(\s*)/)[1];
    if ( leading !== expected ) this.report(this.#message(expected, leading), { column: 0, line: node.loc.start.line });
  }

  /* -------------------------------------------- */

  /**
   * Build a human-readable indentation violation message.
   * @param {string} expected
   * @param {string} found
   * @returns {string}
   */
  #message(expected, found) {
    const unit = this.options.style === "tab" ? "tab(s)" : "space(s)";
    return `Expected ${expected.length} ${unit} of indentation but found ${found.length}`;
  }

  /* -------------------------------------------- */

  /**
   * Walk an array of statement nodes at the given nesting depth.
   * @param {AST.Statement[]} nodes
   * @param {number} depth
   */
  #walkBody(nodes, depth) {
    for ( const node of nodes ) {
      if ( node.type === "BlockStatement" ) {
        this.#checkStatementIndent(node, depth);
        this.#walkBody(node.program?.body ?? [], this.options.blockDepth ? depth + 1 : depth);
        if ( node.inverse ) this.#walkBody(node.inverse.body, this.options.blockDepth ? depth + 1 : depth);
        this.#checkCloseTagIndent(node, depth);
      } else if ( node.type === "ContentStatement" ) {
        this.#checkContentLines(node, depth);
      } else {
        this.#checkStatementIndent(node, depth);
      }
    }
  }

}

/* -------------------------------------------- */

export default IndentationRule.rule();
