import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

const CONFIG_FILE = "hbslint.config.mjs";

/**
 * @typedef {"error"|"warn"} Severity
 */

/**
 * @typedef NormalizedRule
 * @property {boolean} enabled
 * @property {Severity} severity
 * @property {Record<string, unknown>} options
 */

/**
 * @typedef NormalizedConfig
 * @property {Record<string, NormalizedRule>} rules
 */

/**
 * Default options applied per rule when not specified by the user.
 */
const RULE_DEFAULTS = {
  indentation: { blockDepth: false, size: 4, style: "space" },
  "line-length": { max: 120 },
  "mustache-spacing": {},
  "quote-style": { style: "double" }
};

/**
 * Walk up the directory tree from startDir looking for hbslint.config.mjs.
 * Returns the first match found, or null if none exists up to the filesystem root.
 * @param {string} start
 * @returns {string|null}
 */
export function findConfig(start) {
  let dir = start;
  while ( true ) {
    const candidate = join(dir, CONFIG_FILE);
    if ( existsSync(candidate) ) return candidate;
    const parent = dirname(dir);
    if ( parent === dir ) return null; // reached filesystem root
    dir = parent;
  }
}

/* -------------------------------------------- */

/**
 * Load a config file via dynamic import and return its default export as a raw config object.
 * @param {string} path  Absolute path to the config file.
 * @returns {Promise<Record<string, unknown>>}
 */
export async function loadConfig(path) {
  // Use a file:// URL so dynamic import works correctly on Windows with absolute paths.
  const url = new URL(`file:///${path.replace(/\\/g, "/")}`);
  const mod = await import(url.href);
  return mod.default;
}

/* -------------------------------------------- */

/**
 * Normalize a raw config object (as exported from hbslint.config.mjs) into a NormalizedConfig.
 * @param {Record<string, unknown>} raw
 * @returns {NormalizedConfig}
 */
export function normalizeConfig(raw) {
  const rules = {};
  for ( const [name, value] of Object.entries(raw.rules ?? {}) ) {
    if ( !(name in RULE_DEFAULTS) ) console.warn(`hbslint: unknown rule "${name}" in config`);
    rules[name] = normalizeRule(name, value);
  }
  // Ensure every known rule has an entry (disabled by default if not in config).
  for ( const name of Object.keys(RULE_DEFAULTS) ) {
    if ( !(name in rules) ) rules[name] = { enabled: false, options: RULE_DEFAULTS[name], severity: "error" };
  }
  return { rules };
}

/* -------------------------------------------- */

/**
 * Normalize a single rule config value into a NormalizedRule.
 * Accepts the three forms used in hbslint.config.mjs: a severity string, false/"off" to disable, or a
 * [severity, options] tuple.
 * @param {string} name  Rule name, used to look up defaults.
 * @param {string|false|[string, Record<string, unknown>]} value
 * @returns {NormalizedRule}
 */
function normalizeRule(name, value) {
  const defaults = RULE_DEFAULTS[name] ?? {};

  if ( (value === false) || (value === "off") ) return { enabled: false, options: defaults, severity: "error" };

  if ( Array.isArray(value) ) {
    const [severity, userOptions={}] = value;
    return { severity, enabled: true, options: { ...defaults, ...userOptions } };
  }

  return { enabled: true, options: defaults, severity: value };
}
