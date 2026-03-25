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
    this.#walkBody(ast.body, null);
  }

  /* -------------------------------------------- */

  /** @override */
  _listeners() {
    return {};
  }

  /* -------------------------------------------- */

  /**
   * Check that the close tag of a BlockStatement matches the block's opening indentation.
   * @param {AST.BlockStatement} node
   * @param {string} indent
   */
  #checkCloseTagIndent(node, indent) {
    const lineText = this.#lines[node.loc.end.line - 1];
    const leading = lineText.match(/^(\s*)/)[1];
    if ( leading !== indent ) this.report(this.#message(indent, leading), { column: 0, line: node.loc.end.line });
  }

  /* -------------------------------------------- */

  /**
   * Check non-blank lines within a ContentStatement's value for correct leading whitespace.
   * @param {AST.ContentStatement} node
   * @param {string} indent
   */
  #checkContentLines(node, indent) {
    let lineNum = node.loc.start.line;
    for ( const line of getLines(node.value) ) {
      if ( line.trim() ) {
        const leading = line.match(/^(\s*)/)[1];
        if ( leading !== indent ) this.report(this.#message(indent, leading), { column: 0, line: lineNum });
      }
      lineNum++;
    }
  }

  /* -------------------------------------------- */

  /**
   * Check that the source line a statement starts on has the expected leading whitespace.
   * @param {AST.BaseNode} node
   * @param {string} indent
   */
  #checkStatementIndent(node, indent) {
    const lineText = this.#lines[node.loc.start.line - 1];
    const leading = lineText.match(/^(\s*)/)[1];
    if ( leading !== indent ) this.report(this.#message(indent, leading), { column: 0, line: node.loc.start.line });
  }

  /* -------------------------------------------- */

  /**
   * Return the leading whitespace of the given source line.
   * @param {number} lineNum  1-based line number.
   * @returns {string}
   */
  #getLineIndent(lineNum) {
    return this.#lines[lineNum - 1].match(/^(\s*)/)[1];
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
   * Walk an array of statement nodes, checking indentation relative to each block's actual indent.
   * Pass null at the root level to skip checking root nodes' own indentation.
   * @param {AST.Statement[]} nodes
   * @param {string|null} indent  Expected leading whitespace, or null at root.
   */
  #walkBody(nodes, indent) {
    for ( const node of nodes ) {
      if ( node.type === "BlockStatement" ) {
        if ( indent !== null ) this.#checkStatementIndent(node, indent);
        const blockIndent = this.#getLineIndent(node.loc.start.line);
        const bodyIndent = this.options.blockDepth ? blockIndent + this.#indent : blockIndent;
        this.#walkBody(node.program?.body ?? [], bodyIndent);
        if ( node.inverse ) this.#walkBody(node.inverse.body, bodyIndent);
        this.#checkCloseTagIndent(node, blockIndent);
      } else if ( node.type === "ContentStatement" ) {
        if ( indent !== null ) this.#checkContentLines(node, indent);
      } else if ( indent !== null ) this.#checkStatementIndent(node, indent);
    }
  }

}

/* -------------------------------------------- */

export default IndentationRule.rule();
