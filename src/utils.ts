import type { Linter } from 'eslint'
import type { NormalizedTestCase, RuleModule, TestCase, TestCaseError } from './types'
import { interpolate } from './vendor/interpolate'

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
  return lines.map(line => line.slice(commonIndent)).join('\n').trim()
}

export function normalizeTestCase(c: TestCase, type?: 'valid' | 'invalid'): NormalizedTestCase {
  const obj = typeof c === 'string'
    ? { code: c }
    : { ...c }
  const normalized = obj as NormalizedTestCase
  normalized.type ||= type || (('errors' in obj || 'output' in obj) ? 'invalid' : 'valid')
  return normalized
}

export function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined)
    return []
  return Array.isArray(value) ? value : [value]
}

export function normalizeCaseError(error: TestCaseError | string, rule?: RuleModule): Partial<Linter.LintMessage> {
  if (typeof error === 'string')
    return { messageId: error }
  const clone = { ...error }
  if ('data' in clone) {
    if (!rule)
      throw new Error(`'data' property in invalid test case requires 'rule' to be provided at the top level`)
    if (!clone.messageId)
      throw new Error(`'data' property is provided but 'messageId' is missing`)
    if (clone.message)
      throw new Error(`'data' and 'message' properties are mutually exclusive`)
    const template = rule.meta?.messages?.[clone.messageId]
    if (!template)
      throw new Error(`Message ID '${clone.messageId}' is not found in the rule meta`)
    clone.message = interpolate(template, clone.data)
    delete clone.data
  }
  if ('type' in clone) {
    clone.nodeType = clone.type
    delete clone.type
  }
  return clone as Partial<Linter.LintMessage>
}

export function objectPick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result: any = {}
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key))
      result[key] = obj[key]
  }
  return result
}
