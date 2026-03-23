#!/usr/bin/env node

/**
 * @import { Violation } from '../src/rules/base.mjs'
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { parseArgs } from "node:util";

import { globSync } from "glob";

import { findConfig, loadConfig, normalizeConfig } from "../src/config.mjs";
import { check } from "../src/linter.mjs";

/* -------------------------------------------- */

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    config: { short: "c", type: "string" },
    "max-warnings": { type: "string" }
  }
});

const maxWarnings = values["max-warnings"] !== undefined ? Number(values["max-warnings"]) : Infinity;

/* -------------------------------------------- */

// Expand globs and deduplicate.
const files = new Set(positionals.flatMap(p => globSync(p, { nodir: true })));

if ( !files.size ) {
  console.error("hbslint: no files matched");
  process.exit(2);
}

/* -------------------------------------------- */

let errorCount = 0;
let warningCount = 0;

for ( const file of files ) {
  const absPath = resolve(file);
  let source;
  try {
    source = readFileSync(absPath, "utf8");
  } catch {
    console.error(`hbslint: could not read file "${file}"`);
    process.exit(2);
  }

  const configPath = values.config ? resolve(values.config) : findConfig(dirname(absPath));

  let config;
  try {
    const raw = configPath ? await loadConfig(configPath) : { rules: {} };
    config = normalizeConfig(raw);
  } catch ( err ) {
    console.error(`hbslint: failed to load config: ${err.message}`);
    process.exit(2);
  }

  const violations = check(source, config);
  if ( !violations.length ) continue;

  for ( const v of violations ) {
    const loc = `${file}:${v.line}:${v.column}`;
    console.log(`${loc}  ${v.severity}  ${v.message}  (${v.rule})`);
    if ( v.severity === "error" ) errorCount++;
    else warningCount++;
  }
}

/* -------------------------------------------- */

const total = errorCount + warningCount;
if ( total ) console.log(`\n${errorCount} error(s), ${warningCount} warning(s)`);
if ( errorCount || (warningCount > maxWarnings) ) process.exit(1);
