import type { Rule } from 'eslint'
import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import type {
  CompatConfigOptions,
  InvalidTestCase,
  RuleTester,
  RuleTesterClassicOptions,
  RuleTesterOptions,
  TestCase,
  TestCaseError,
  ValidTestCase,
} from './types'
import { normalizeTestCase } from './utils'
import { interpolate } from './vendor/interpolate'

export * from './utils'
export type * from './types'

export function createRuleTester(options: RuleTesterOptions): RuleTester {
  const {
    recursive = 5,
    verifyAfterFix = true,
    rule,
  } = options

  const linter = new Linter({ configType: 'flat' })

  function rewriteMessage(messages: Linter.LintMessage) {
    if (messages.ruleId)
      messages.ruleId = messages.ruleId.replace(/^rule-to-test\//, '')
  }

  const defaultConfigs = toArray(options.configs)
  {
    const inlineConfig = pickFlatConfigFromOptions(options)
    if (inlineConfig)
      defaultConfigs.unshift(inlineConfig)
  }

  function normalizeCaseError(error: TestCaseError | string): Partial<Linter.LintMessage> {
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

  function each(c: TestCase) {
    const testcase = normalizeTestCase(c)
    const configs = [...defaultConfigs]

    if (options.rule) {
      const ruleName = options.name || 'rule-to-test'

      configs.push(
        {
          name: 'rule-to-test',
          plugins: {
            'rule-to-test': {
              rules: {
                [ruleName]: options.rule as any,
              },
            },
          },
          rules: {
            [`rule-to-test/${ruleName}`]: Array.isArray(testcase.options)
              ? ['error', ...testcase.options]
              : testcase.options !== undefined
                ? ['error', testcase.options]
                : 'error',
          },
          ...pickFlatConfigFromOptions(testcase),
        },
      )
    }

    const messages = linter.verify(testcase.code!, configs, testcase.filename)
    messages.forEach(rewriteMessage)

    if (testcase.errors) {
      if (typeof testcase.errors === 'function') {
        testcase.errors(messages)
      }
      else if (typeof testcase.errors === 'number') {
        expect.soft(messages.length, 'number of error messages').toBe(testcase.errors)
      }
      else {
        const errors = toArray(testcase.errors)
          .map(e => normalizeCaseError(e))

        expect(messages.length, 'number of error messages').toBe(errors.length)

        errors.forEach((e, i) => {
          expect.soft(messages[i], 'error massage object').toMatchObject(e)
        })
      }
    }

    function fix(input: string) {
      const result = linter.verifyAndFix(input, configs, testcase.filename)
      if (result.fixed && result.output === input)
        throw new Error(`Fix does not change the code, it's likely to cause infinite fixes`)
      return result
    }

    const step1 = fix(testcase.code!)
    const result = {
      ...step1,
      steps: [step1],
    }
    if (result.fixed && recursive !== false) {
      let r = recursive
      for (r = recursive; r >= 0; r--) {
        const step = fix(result.output!)
        result.steps.push(step)
        result.output = step.output
        if (!step.fixed)
          break
      }
      if (r < 0)
        throw new Error(`Fix recursion limit exceeded, possibly the fix is not stable. Last output:\n-------\n${result.output}\n-------`)
    }
    result.messages = messages

    if (testcase.output !== undefined) {
      if (testcase.output === null) // null means the output should be the same as the input
        expect(result.output, 'output').toBe(testcase.code)
      else if (typeof testcase.output === 'function') // custom assertion
        testcase.output(result.output!, testcase.code)
      else
        expect(result.output, 'output').toBe(testcase.output)
    }

    if (testcase.type === 'invalid' && testcase.output === undefined && testcase.errors === undefined)
      throw new Error(`Invalid test case must have either 'errors' or 'output' property`)

    if (verifyAfterFix && result.fixed) {
      const messages = linter.verify(
        result.output!,
        configs,
        testcase.filename,
      )
      expect.soft(messages, 'no errors after fix').toEqual([])
    }

    testcase.onResult?.(result)

    return result
  }

  function valid(arg: ValidTestCase | string) {
    const result = each(arg)
    expect.soft(result.fixed).toBeFalsy()
    expect.soft(result.messages).toEqual([])
    return result
  }

  function invalid(arg: InvalidTestCase | string) {
    const result = each(arg)
    expect.soft(result.messages).not.toEqual([])
    return result
  }

  function run(cases: RuleTesterClassicOptions) {
    describe(options.name || 'rule-to-test', () => {
      if (cases.valid?.length) {
        describe('valid', () => {
          for (const c of cases.valid!) {
            const _case = normalizeTestCase(c, 'valid')
            let run: typeof it | typeof it.only = it
            if (_case.only)
              run = it.only
            if (_case.skip)
              run = it.skip
            run(_case.description || _case.code, async () => {
              const result = valid(_case)
              await cases?.onResult?.(_case, result)
            })
          }
        })
      }
      if (cases.invalid?.length) {
        describe('invalid', () => {
          for (const c of cases.invalid!) {
            const _case = normalizeTestCase(c, 'invalid')
            let run: typeof it | typeof it.only = it
            if (_case.only)
              run = it.only
            if (_case.skip)
              run = it.skip
            run(_case.description || _case.code, async () => {
              const result = invalid(_case)
              await cases?.onResult?.(_case, result)
            })
          }
        })
      }
    })
  }

  return {
    each,
    valid,
    invalid,
    run,
  }
}

function objectPick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result: any = {}
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key))
      result[key] = obj[key]
  }
  return result
}

export function run(
  ruleName: string,
  rule: Rule.RuleModule,
  cases: RuleTesterClassicOptions,
  options?: RuleTesterOptions,
) {
  const tester = createRuleTester({
    rule,
    name: ruleName,
    ...options,
  })
  return tester.run(cases)
}

export function pickFlatConfigFromOptions(options: CompatConfigOptions): Linter.FlatConfig | undefined {
  const picked = objectPick(
    options,
    [
      'parserOptions',
      'parser',
      'languageOptions',
      'linterOptions',
      'settings',
      'processor',
      'files',
    ] satisfies (keyof CompatConfigOptions)[],
  )

  if (picked.parserOptions) {
    picked.languageOptions ||= {}
    picked.languageOptions.parserOptions = picked.parserOptions
    if (picked.parserOptions.ecmaVersion)
      picked.languageOptions.ecmaVersion = picked.parserOptions.ecmaVersion
    delete picked.parserOptions
  }
  if (picked.parser) {
    picked.languageOptions ||= {}
    picked.languageOptions.parser = picked.parser
    delete picked.parser
  }
  if (Object.keys(picked).length)
    return picked
  return undefined
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined)
    return []
  return Array.isArray(value) ? value : [value]
}
