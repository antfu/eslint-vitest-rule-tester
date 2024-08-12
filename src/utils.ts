import path from 'node:path'
import process from 'node:process'
import type { Linter } from 'eslint'
import { unindent } from '@antfu/utils'
import type { DefaultFilenames, NormalizedTestCase, RuleModule, TestCase, TestCaseError } from './types'
import { interpolate } from './vendor/interpolate'

export { unindent, unindent as $ }

export function normalizeTestCase(
  c: TestCase,
  languageOptions: Linter.FlatConfig['languageOptions'],
  defaultFilenames: DefaultFilenames,
  type?: 'valid' | 'invalid',
): NormalizedTestCase {
  const obj = typeof c === 'string'
    ? { code: c }
    : { ...c }
  const normalized = obj as NormalizedTestCase
  normalized.type ||= type || (('errors' in obj || 'output' in obj) ? 'invalid' : 'valid')

  if (isUsingTypeScriptParser(languageOptions)) {
    normalized.filename ||= getDefaultTypeScriptFilename(languageOptions, defaultFilenames)
    normalized.parserOptions = {
      ecmaVersion: 'latest',
      sourceType: 'module',
      disallowAutomaticSingleRunInference: true,
      ...normalized.parserOptions,
    }
  }
  else {
    normalized.filename ||= getDefaultJavaScriptFilename(languageOptions, defaultFilenames)
  }
  return normalized
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

function getDefaultJavaScriptFilename(
  languageOptions: Linter.FlatConfig['languageOptions'],
  defaultFilenames: DefaultFilenames,
) {
  return languageOptions?.parserOptions?.ecmaFeatures?.jsx
    ? defaultFilenames.jsx
    : defaultFilenames.js
}

function getDefaultTypeScriptFilename(
  languageOptions: Linter.FlatConfig['languageOptions'],
  defaultFilenames: DefaultFilenames,
) {
  const rootPath = (isUsingTypeScriptTypings(languageOptions)
    ? languageOptions?.parserOptions?.tsconfigRootDir
    : undefined)
    /*
     * Can we do better than cwd?
     * This is what typescript-eslint is using though.
     *
     * @see https://github.com/typescript-eslint/typescript-eslint/blob/v8.0.0/packages/rule-tester/src/RuleTester.ts#L305
     */
    ?? process.cwd()

  const filename = languageOptions?.parserOptions?.ecmaFeatures?.jsx
    ? defaultFilenames.tsx
    : defaultFilenames.ts

  return path.join(rootPath, filename)
}

export function isUsingTypeScriptParser(languageOptions: Linter.FlatConfig['languageOptions']) {
  return languageOptions?.parser?.meta?.name === 'typescript-eslint/parser'
}

export function isUsingTypeScriptTypings(languageOptions: Linter.FlatConfig['languageOptions']) {
  return languageOptions?.parserOptions?.program
    || languageOptions?.parserOptions?.project
    || languageOptions?.parserOptions?.projectService
}
