/**
 * @import { AST } from '@handlebars/parser'
 * @import { RuleMeta } from './base.mjs'
 */

import { getLines } from "../utils.mjs";

import { BaseRule } from "./base.mjs";

/* -------------------------------------------- */

/**
 * Enforce a maximum line length across all lines in the template source.
 * Overrides _check to operate entirely on raw source lines without AST traversal.
 */
class LineLengthRule extends BaseRule {

  /**
   * @type {RuleMeta}
   */
  static meta = {
    name: "line-length"
  };

  /* -------------------------------------------- */

  /** @override */
  _check(_ast) {
    this.#checkLines();
  }

  /* -------------------------------------------- */

  /** @override */
  _listeners() {
    return {};
  }

  /* -------------------------------------------- */

  /**
   * Check every source line against the configured maximum length.
   */
  #checkLines() {
    const max = this.options.max ?? 120;
    let lineNum = 1;
    for ( const line of getLines(this.source) ) {
      if ( line.length > max ) {
        this.report(`Line exceeds ${max} characters (${line.length})`, { column: max, line: lineNum });
      }
      lineNum++;
    }
  }

}

/* -------------------------------------------- */

export default LineLengthRule.rule();
