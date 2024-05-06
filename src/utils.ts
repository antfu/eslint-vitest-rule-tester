import type { NormalizedTestCase, TestCase } from './types'

/**
 * Remove common leading whitespace from a template string.
 *
 * @example
 * ```ts
 * const str = unindent`
 *   if (a) {
 *     b()
 *   }
 * `
 */
export function unindent(str: TemplateStringsArray) {
  const lines = str[0].split('\n')
  const commonIndent = lines.slice(1).reduce((min, line) => {
    if (/^\s*$/.test(line))
      return min
    const indent = line.match(/^\s*/)?.[0].length
    return indent === undefined ? min : Math.min(min, indent)
  }, Number.POSITIVE_INFINITY)
  return lines.map(line => line.slice(commonIndent)).join('\n')
}

export function normalizeTestCase(c: TestCase, type?: 'valid' | 'invalid'): NormalizedTestCase {
  const obj = typeof c === 'string'
    ? { code: c }
    : { ...c }
  const normalized = obj as NormalizedTestCase
  normalized.type ||= type || (('errors' in obj || 'output' in obj) ? 'invalid' : 'valid')
  return normalized
}
