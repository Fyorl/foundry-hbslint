/**
 * @import { AST } from '@handlebars/parser'
 * @import { NodeListener, RuleMeta } from './base.mjs'
 */

import { BaseRule } from "./base.mjs";

/* -------------------------------------------- */

/**
 * Enforce consistent quote characters around string literals in templates.
 * Applies to hash pair values and expression params.
 * The AST strips quote information, so the raw source is inspected at each StringLiteral's loc to determine which
 * quote character was used.
 */
class QuoteStyleRule extends BaseRule {

  /**
   * @type {RuleMeta}
   */
  static meta = {
    name: "quote-style"
  };

  /* -------------------------------------------- */

  /** @override */
  _listeners() {
    return {
      StringLiteral: this.#onStringLiteral.bind(this)
    };
  }

  /* -------------------------------------------- */

  /**
   * Check that the quote character surrounding a string literal matches the configured style.
   * @param {AST.StringLiteral} node
   */
  #onStringLiteral(node) {
    const expected = this.options.style === "single" ? "'" : '"';
    const raw = this.rawOf(node);
    if ( raw[0] !== expected ) {
      const found = raw[0] === '"' ? "double" : "single";
      const want = this.options.style ?? "double";
      this.report(`Expected ${want} quotes but found ${found} quotes in ${raw}`, node);
    }
  }

}

/* -------------------------------------------- */

export default QuoteStyleRule.rule();
