/**
 * @typedef Location
 * @property {number} line    1-based line number from the @handlebars/parser AST
 * @property {number} column  0-based column number from the @handlebars/parser AST
 */

const BUFFER_SIZE = 4096;

/**
 * Iterate over the lines of source one at a time using a fixed-size Uint16Array buffer.
 * Emits each line as a string without the trailing newline. Handles both LF and CRLF line endings.
 * @param {string} source
 * @yields {string}
 */
export function* getLines(source) {
  const buf = new Uint16Array(BUFFER_SIZE);
  let pos = 0;
  let line = "";

  for ( let i = 0; i < source.length; i++ ) {
    const ch = source.charCodeAt(i);

    if ( (ch === 0x0a) /* \n */ || (ch === 0x0d) /* \r */ ) {
      if ( (ch === 0x0d) && (source.charCodeAt(i + 1) === 0x0a) ) i++; // skip \n in \r\n
      line += String.fromCharCode(...buf.subarray(0, pos));
      yield line;
      line = "";
      pos = 0;
    } else {
      buf[pos++] = ch;
      if ( pos === BUFFER_SIZE ) {
        line += String.fromCharCode(...buf.subarray(0, BUFFER_SIZE));
        pos = 0;
      }
    }
  }

  // Emit the final line if source does not end with a newline.
  if ( pos ) yield line + String.fromCharCode(...buf.subarray(0, pos));
}

/* -------------------------------------------- */

/**
 * Extract the raw source string between two Location positions (inclusive of start, exclusive of end).
 * @param {string} source
 * @param {Location} startLoc
 * @param {Location} endLoc
 * @returns {string}
 */
export function getRawBetween(source, startLoc, endLoc) {
  const start = locToOffset(source, startLoc);
  const end = locToOffset(source, endLoc);
  return source.slice(start, end);
}

/* -------------------------------------------- */

/**
 * Convert a Location to a flat character offset into source.
 * Uses the getLines generator and stops as soon as the target line is reached, avoiding unnecessary iteration.
 * @param {string} source
 * @param {Location} loc
 * @returns {number}
 */
function locToOffset(source, loc) {
  let offset = 0;
  let lineNum = 0;
  for ( const line of getLines(source) ) {
    if ( lineNum === (loc.line - 1) ) break;
    offset += line.length + 1; // +1 for the \n (CRLF is collapsed by getLines)
    lineNum++;
  }
  return offset + loc.column;
}
