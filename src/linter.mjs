/**
 * @import { AST } from '@handlebars/parser'
 * @import { Violation } from './rules/base.mjs'
 */

import { parse } from "@handlebars/parser";

import rules from "./rules/_module.mjs";

/* -------------------------------------------- */

/**
 * @typedef NormalizedRuleConfig
 * @property {boolean} enabled
 * @property {"error"|"warn"} severity
 * @property {Record<string, unknown>} options
 */

/**
 * @typedef NormalizedConfig
 * @property {Record<string, NormalizedRuleConfig>} rules
 */

/* -------------------------------------------- */

/**
 * Check all enabled rules against the given source and return a flat array of violations sorted by line then column.
 * A parse error is returned as a single error-severity violation.
 * @param {string} source
 * @param {NormalizedConfig} config
 * @returns {Violation[]}
 */
export function check(source, config) {
  let ast;
  try {
    ast = parse(source);
  } catch ( err ) {
    return [{
      column: err.loc?.start?.column ?? 0,
      line: err.loc?.start?.line ?? 1,
      message: err.message,
      rule: "parse",
      severity: "error"
    }];
  }

  const violations = [];
  for ( const [name, { enabled, options, severity }] of Object.entries(config.rules) ) {
    if ( !enabled ) continue;
    const fn = rules[name];
    if ( !fn ) {
      console.warn(`hbslint: no implementation found for rule "${name}"`);
      continue;
    }
    for ( const v of fn(ast, source, options) ) violations.push({ ...v, severity });
  }

  return violations.sort((a, b) => (a.line - b.line) || (a.column - b.column));
}
