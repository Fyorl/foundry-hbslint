import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { parse } from "@handlebars/parser";

import indentationRule from "../src/rules/indentation.mjs";
import lineLengthRule from "../src/rules/line-length.mjs";
import mustacheSpacingRule from "../src/rules/mustache-spacing.mjs";
import quoteStyleRule from "../src/rules/quote-style.mjs";

/* -------------------------------------------- */

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const load = fixture => readFileSync(join(fixtureDir, fixture), "utf8");

/* -------------------------------------------- */

/**
 * @typedef Theory
 * @property {string} name
 * @property {string} fixture  Path relative to test/fixtures/
 * @property {Function} rule
 * @property {Record<string, unknown>} [options]
 * @property {{ line?: number, column?: number, message?: RegExp }[]} [violations]
 */

/**
 * @type {Theory[]}
 */
const theories = [

  // line-length
  {
    fixture: "line-length/valid-short.hbs",
    name: "line-length: valid short lines produce no violations",
    options: { max: 120 },
    rule: lineLengthRule
  },
  {
    fixture: "line-length/invalid-long-line.hbs",
    name: "line-length: line exceeding max produces one violation at the correct position",
    options: { max: 120 },
    rule: lineLengthRule,
    violations: [{ column: 120, line: 2, message: /exceeds 120/ }]
  },
  {
    fixture: "line-length/valid-short.hbs",
    name: "line-length: respects custom max - all three lines of the short fixture exceed max: 5",
    options: { max: 5 },
    rule: lineLengthRule,
    violations: [
      { column: 5, line: 1, message: /exceeds 5/ },
      { column: 5, line: 2, message: /exceeds 5/ },
      { column: 5, line: 3, message: /exceeds 5/ }
    ]
  },

  // mustache-spacing
  {
    fixture: "mustache-spacing/valid-inline.hbs",
    name: "mustache-spacing: valid inline mustaches produce no violations",
    rule: mustacheSpacingRule
  },
  {
    fixture: "mustache-spacing/valid-block.hbs",
    name: "mustache-spacing: valid block tags produce no violations",
    rule: mustacheSpacingRule
  },
  {
    fixture: "mustache-spacing/valid-partial.hbs",
    name: "mustache-spacing: valid partials produce no violations",
    rule: mustacheSpacingRule
  },
  {
    fixture: "mustache-spacing/invalid-inline-no-space.hbs",
    name: "mustache-spacing: inline mustache without spaces reports violation on line 1",
    rule: mustacheSpacingRule,
    violations: [{ column: 0, line: 1, message: /spaces inside/ }]
  },
  {
    fixture: "mustache-spacing/invalid-block-has-space.hbs",
    name: "mustache-spacing: block open tag with space reports violation on line 1",
    rule: mustacheSpacingRule,
    violations: [{ column: 0, line: 1, message: /Unexpected space inside block open tag/ }]
  },
  {
    fixture: "mustache-spacing/invalid-partial-no-space.hbs",
    name: "mustache-spacing: partial without space after > reports violation on line 1",
    rule: mustacheSpacingRule,
    violations: [{ column: 0, line: 1, message: /partial/ }]
  },

  // quote-style
  {
    fixture: "quote-style/valid-double.hbs",
    name: "quote-style: double-quoted strings produce no violations when style is double",
    options: { style: "double" },
    rule: quoteStyleRule

  },
  {
    fixture: "quote-style/invalid-single.hbs",
    name: "quote-style: single-quoted string reports violation when style is double",
    options: { style: "double" },
    rule: quoteStyleRule,
    violations: [{ column: 12, line: 1, message: /double/ }]
  },
  {
    fixture: "quote-style/invalid-single.hbs",
    name: "quote-style: single-quoted string is valid when style is single",
    options: { style: "single" },
    rule: quoteStyleRule

  },

  // indentation
  {
    fixture: "indentation/valid-2-spaces.hbs",
    name: "indentation: correctly indented template produces no violations (blockDepth: true)",
    options: { blockDepth: true, size: 2, style: "space" },
    rule: indentationRule

  },
  {
    fixture: "indentation/invalid-wrong-indent.hbs",
    name: "indentation: unindented content inside block reports violation on line 2 (blockDepth: true)",
    options: { blockDepth: true, size: 2, style: "space" },
    rule: indentationRule,
    violations: [{ column: 0, line: 2, message: /indentation/ }]
  },
  {
    fixture: "indentation/valid-2-spaces.hbs",
    name: "indentation: 2-space fixture reports violations when 4-space indentation is required (blockDepth: true)",
    options: { blockDepth: true, size: 4, style: "space" },
    rule: indentationRule,
    violations: [
      { column: 0, line: 2, message: /indentation/ },
      { column: 0, line: 3, message: /indentation/ },
      { column: 0, line: 4, message: /indentation/ }
    ]
  },
  {
    fixture: "indentation/invalid-wrong-indent.hbs",
    name: "indentation: zero-indent content inside block is valid when blockDepth is false",
    options: { blockDepth: false, size: 2, style: "space" },
    rule: indentationRule
  },
  {
    fixture: "indentation/valid-2-spaces.hbs",
    name: "indentation: indented block content produces violations when blockDepth is false",
    options: { blockDepth: false, size: 2, style: "space" },
    rule: indentationRule,
    violations: [
      { column: 0, line: 2, message: /indentation/ },
      { column: 0, line: 3, message: /indentation/ },
      { column: 0, line: 4, message: /indentation/ }
    ]
  },
  {
    fixture: "indentation/valid-html-context.hbs",
    name: "indentation: block indented inside HTML is valid when content matches block indent (blockDepth: false)",
    options: { blockDepth: false, size: 4, style: "space" },
    rule: indentationRule
  },
  {
    fixture: "indentation/invalid-html-context.hbs",
    name: "indentation: content indented beyond block level reports violation (blockDepth: false)",
    options: { blockDepth: false, size: 4, style: "space" },
    rule: indentationRule,
    violations: [{ column: 0, line: 2, message: /indentation/ }]
  }
];

/* -------------------------------------------- */

for ( const theory of theories ) {
  test(theory.name, () => {
    const src = load(theory.fixture);
    const result = theory.rule(parse(src), src, theory.options ?? {});
    const expected = theory.violations ?? [];
    assert.equal(result.length, expected.length);
    for ( const [i, v] of expected.entries() ) {
      if ( v.line !== undefined ) assert.equal(result[i].line, v.line);
      if ( v.column !== undefined ) assert.equal(result[i].column, v.column);
      if ( v.message ) assert.match(result[i].message, v.message);
    }
  });
}
