/**
 * @import { Violation } from './rules/base.mjs'
 */

import { resolve } from "node:path";

import { findConfig, loadConfig, normalizeConfig } from "./config.mjs";
import { check } from "./linter.mjs";

export { check };

/* -------------------------------------------- */

/**
 * Lint a Handlebars source string using a config resolved from the given directory (or cwd).
 * Convenience wrapper for callers who want config discovery without managing it themselves.
 * @param {string} source
 * @param {{ configPath?: string, cwd?: string }} [options]
 * @returns {Promise<Violation[]>}
 */
export async function lint(source, { configPath, cwd=process.cwd() }={}) {
  const resolved = configPath ? resolve(configPath) : findConfig(cwd);
  const raw = resolved ? await loadConfig(resolved) : { rules: {} };
  return check(source, normalizeConfig(raw));
}
