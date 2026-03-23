/**
 * @import { AST } from '@handlebars/parser'
 * @import { NodeListener, RuleMeta } from './base.mjs'
 */

import { BaseRule } from "./base.mjs";

/* -------------------------------------------- */

/**
 * Enforce consistent spacing inside `{{ }}` delimiters based on node type:
 * - MustacheStatement: spaces required -> `{{ foo }}`
 * - BlockStatement open/close: no spaces -> `{{#if}}`, `{{/if}}`
 * - PartialStatement: space after `>` -> `{{> partial }}`
 */
class MustacheSpacingRule extends BaseRule {

  /**
   * @type {RuleMeta}
   */
  static meta = {
    name: "mustache-spacing"
  };

  /* -------------------------------------------- */

  /** @override */
  _listeners() {
    return {
      BlockStatement: this.#onBlock.bind(this),
      MustacheStatement: this.#onMustache.bind(this),
      PartialStatement: this.#onPartial.bind(this)
    };
  }

  /* -------------------------------------------- */

  /**
   * Check that a BlockStatement's open and close tags have no inner spacing, and that any {{else}} tag is exactly
   * `{{else}}` with no surrounding spaces.
   * @param {AST.BlockStatement} node
   */
  #onBlock(node) {
    const raw = this.rawOf(node);

    // Open tag: read forward from the start to the first `}}`.
    const openEnd = raw.indexOf("}}");
    if ( openEnd !== -1 ) {
      const openTag = raw.slice(0, openEnd + 2);
      // Content begins after `{{#` or `{{^` (index 3).
      const openInner = openTag.slice(3, openTag.length - 2);
      if ( openInner.startsWith(" ") || openInner.endsWith(" ") ) {
        this.report(`Unexpected space inside block open tag "${openTag}"`, node);
      }
    }

    // Close tag: scan backwards from the end for `{{`
    const closeStart = raw.lastIndexOf("{{");
    if ( closeStart !== -1 ) {
      const closeTag = raw.slice(closeStart);
      // Content begins after `{{/` (index 3).
      const closeInner = closeTag.slice(3, closeTag.length - 2);
      if ( closeInner.startsWith(" ") || closeInner.endsWith(" ") ) {
        this.report(`Unexpected space inside block close tag "${closeTag}"`, {
          column: node.loc.end.column - closeTag.length,
          line: node.loc.end.line
        });
      }
    }

    // {{else}}: scan the raw block for any else tag and verify it has no extra spacing.
    if ( node.inverse ) {
      const elseMatch = raw.match(/\{\{\s*else\s*}}/);
      if ( elseMatch && (elseMatch[0] !== "{{else}}") ) {
        const before = raw.slice(0, elseMatch.index);
        const beforeLines = before.split("\n");
        const elseLine = node.loc.start.line + beforeLines.length - 1;
        const elseCol = beforeLines.length === 1 ? node.loc.start.column + elseMatch.index : beforeLines.at(-1).length;
        this.report(`Unexpected spacing in else tag "${elseMatch[0]}" - expected "{{else}}"`, {
          column: elseCol,
          line: elseLine
        });
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Check that a MustacheStatement has a space immediately after `{{` and before `}}`.
   * @param {AST.MustacheStatement} node
   */
  #onMustache(node) {
    const raw = this.rawOf(node);
    if ( !raw.startsWith("{{ ") || !raw.endsWith(" }}") ) this.report(`Expected spaces inside {{ }} in "${raw}"`, node);
  }

  /* -------------------------------------------- */

  /**
   * Check that a PartialStatement has a space after `>` and before `}}`.
   * @param {AST.PartialStatement} node
   */
  #onPartial(node) {
    const raw = this.rawOf(node);
    if ( !raw.startsWith("{{> ") || !raw.endsWith(" }}") ) {
      this.report(`Expected "{{> partial }}" spacing in partial "${raw}"`, node);
    }
  }

}

/* -------------------------------------------- */

export default MustacheSpacingRule.rule();
