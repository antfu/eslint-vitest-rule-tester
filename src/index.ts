import type { Rule } from 'eslint'
import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import type { InvalidTestCase, RuleTester, RuleTesterClassicOptions, RuleTesterOptions, TestCase, ValidTestCase } from './types'
import { normalizeTestCase } from './utils'

export * from './utils'
export type * from './types'

export function createRuleTester(options: RuleTesterOptions): RuleTester {
  const {
    recursive = 5,
    verifyAfterFix = true,
  } = options

  const linter = new Linter({
    configType: 'flat',
  })

  function rewriteMessage(messages: Linter.LintMessage) {
    if (messages.ruleId)
      messages.ruleId = messages.ruleId.replace(/^rule-to-test\//, '')
  }

  function each(c: TestCase) {
    const _case = normalizeTestCase(c)

    let configs: Linter.FlatConfig[]
    if (Array.isArray(options.configs))
      configs = [...options.configs]
    else if (options.configs)
      configs = [options.configs]
    else
      configs = []

    if (options.rule) {
      const ruleName = options.name || 'rule-to-test'

      const ruleOptions = objectPick(c as any, ['parserOptions', 'settings', 'languageOptions', 'parser'])
      if (ruleOptions.parserOptions) {
        ruleOptions.languageOptions ||= {}
        ruleOptions.languageOptions.parserOptions = ruleOptions.parserOptions
        delete ruleOptions.parserOptions
      }
      if (ruleOptions.settings) {
        ruleOptions.languageOptions ||= {}
        ruleOptions.languageOptions.settings = ruleOptions.settings
        delete ruleOptions.settings
      }
      if (ruleOptions.parser) {
        ruleOptions.languageOptions ||= {}
        ruleOptions.languageOptions.parser = ruleOptions.parser
        delete ruleOptions.parser
      }

      configs.unshift(
        {
          name: 'rule-to-test',
          plugins: {
            'rule-to-test': {
              rules: {
                [ruleName]: options.rule,
              },
            },
          },
          rules: {
            [`rule-to-test/${ruleName}`]: Array.isArray(_case.options)
              ? ['error', ..._case.options]
              : _case.options !== undefined
                ? ['error', _case.options]
                : 'error',
          },
          ...ruleOptions,
        },
      )
    }

    const messages = linter.verify(_case.code!, configs, _case.filename)
    messages.forEach(rewriteMessage)

    if (_case.errors) {
      if (typeof _case.errors === 'function') {
        _case.errors(messages)
      }
      else if (typeof _case.errors === 'number') {
        expect.soft(messages.length, 'number of error messages').toBe(_case.errors)
      }
      else {
        const errors = Array.isArray(_case.errors) ? _case.errors : [_case.errors]
        expect(messages.length, 'number of error messages').toBe(errors.length)

        errors.forEach((e, i) => {
          if (typeof e === 'string')
            expect.soft(messages[i].messageId, 'error massage id').toBe(e)
          else
            expect.soft(messages[i], 'error massage object').toMatchObject(e)
        })
      }
    }

    function fix(input: string) {
      const result = linter.verifyAndFix(input, configs, _case.filename)
      if (result.fixed && result.output === input)
        throw new Error(`Fix does not change the code, it's likely to cause infinite fixes`)
      return result
    }

    const step1 = fix(_case.code!)
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

    if (_case.output !== undefined) {
      if (_case.output === null) // null means the output should be the same as the input
        expect(result.output, 'output').toBe(_case.code)
      else if (typeof _case.output === 'function') // custom assertion
        _case.output(result.output!, _case.code)
      else
        expect(result.output, 'output').toBe(_case.output)
    }

    if (_case.type === 'invalid' && _case.output === undefined && _case.errors === undefined)
      throw new Error(`Invalid test case must have either 'errors' or 'output' property`)

    if (verifyAfterFix && result.fixed) {
      const messages = linter.verify(
        result.output!,
        configs,
        _case.filename,
      )
      expect.soft(messages, 'no errors after fix').toEqual([])
    }

    _case.onResult?.(result)

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
