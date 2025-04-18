/* eslint-disable no-useless-call */
import type {
  InvalidTestCase,
  RuleTester,
  RuleTesterInitOptions,
  TestCase,
  TestCasesOptions,
  ValidTestCase,
} from './types'
import { deepMerge, toArray } from '@antfu/utils'
import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import { pickFlatConfigFromOptions } from './options'
import { isUsingTypeScriptParser, normalizeCaseError, normalizeTestCase } from './utils'
import { getAjvInstance, getRuleOptionsSchema } from './vendor/ajv'
import { applyFixes } from './vendor/fixer'

export function createRuleTester<RuleOptions = any, MessageId extends string = string>(options: RuleTesterInitOptions): RuleTester<RuleOptions, MessageId> {
  const languageOptions = deepMerge(
    options.languageOptions ?? {
      parser: options.parser,
      parserOptions: options.parserOptions,
    },
    ...toArray(options.configs)
      .map(c => c.languageOptions)
      .filter(<T>(c: T | undefined): c is T => c !== undefined),
  ) as Linter.Config['languageOptions']

  const linter = new Linter({
    configType: 'flat',
    cwd: isUsingTypeScriptParser(options.languageOptions)
      ? languageOptions?.parserOptions?.tsconfigRootDir
      : undefined,
  })

  const defaultConfigs = toArray(options.configs)
  {
    const inlineConfig = pickFlatConfigFromOptions(options)
    if (inlineConfig)
      defaultConfigs.unshift(inlineConfig)
  }

  const defaultFilenames = {
    js: 'file.js',
    ts: 'file.ts',
    jsx: 'file.jsx',
    tsx: 'file.tsx',
    ...options.defaultFilenames,
  }

  async function each(c: TestCase<RuleOptions, MessageId>) {
    const testcase = normalizeTestCase(c, languageOptions, defaultFilenames)

    const {
      recursive = 10,
      verifyAfterFix = true,
      verifyFixChanges = true,
    } = {
      ...options,
      ...testcase,
    }

    const configs = [...defaultConfigs]

    if (options.rule) {
      const ruleName = options.name || 'rule-to-test'

      configs.push(
        {
          name: 'rule-to-test',
          files: ['**'],
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

      const schema = getRuleOptionsSchema(options.rule)

      if (schema) {
        const ajv = getAjvInstance()

        ajv.validateSchema(schema)

        if (ajv.errors) {
          const errors = ajv.errors.map((error) => {
            const field = error.dataPath[0] === '.' ? error.dataPath.slice(1) : error.dataPath
            return `\t${field}: ${error.message}`
          })

          throw new Error(`Schema for rule ${ruleName} is invalid: ${errors}`)
        }

        try {
          ajv.compile(schema)
        }
        catch (error) {
          throw new Error(`Schema for rule ${ruleName} is invalid: ${error}`)
        }
      }
    }

    await testcase.before?.call(testcase, configs)

    const messages = linter.verify(testcase.code!, configs, testcase.filename)
    // Rewrite ruleId to remove the plugin prefix
    messages.forEach((message) => {
      if (message.ruleId)
        message.ruleId = message.ruleId.replace(/^rule-to-test\//, '')
    })

    // Verify errors
    if (testcase.errors) {
      if (typeof testcase.errors === 'function') {
        await testcase.errors(messages)
      }
      else if (typeof testcase.errors === 'number') {
        expect.soft(messages.length, 'number of error messages').toBe(testcase.errors)
      }
      else {
        const errors = toArray(testcase.errors)
          .map(e => normalizeCaseError(e, options.rule))

        expect(messages.length, 'number of error messages').toBe(errors.length)

        errors.forEach((e, i) => {
          expect.soft(messages[i], 'error message object').toMatchObject(e)
        })
      }
    }

    function fix(input: string) {
      const problems = linter.verify(input, configs, testcase.filename)
      const result = applyFixes(input, problems)
      if (result.fixed && result.output === input && verifyFixChanges)
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
        await testcase.output(result.output!, testcase.code)

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

    await testcase.onResult?.(result)
    await testcase.after?.call(testcase, result)

    return {
      testcase,
      result,
    }
  }

  async function valid(arg: ValidTestCase<RuleOptions> | string) {
    const result = await each(arg)
    expect.soft(result.result.messages, 'no errors on valid cases').toEqual([])
    expect.soft(result.result.fixed, 'no need to fix for valid cases').toBeFalsy()
    return result
  }

  async function invalid(arg: InvalidTestCase<RuleOptions, MessageId> | string) {
    const result = await each(arg)
    expect.soft(result.result.messages, 'expect errors').not.toEqual([])
    return result
  }

  async function run(cases: TestCasesOptions<RuleOptions, MessageId>) {
    describe(options.name || 'rule-to-test', () => {
      if (cases.valid?.length) {
        describe('valid', () => {
          cases.valid!.forEach((c, index) => {
            const _case = normalizeTestCase(c, languageOptions, defaultFilenames, 'valid')
            let run: typeof it | typeof it.only = it
            if (_case.only)
              run = it.only
            if (_case.skip)
              run = it.skip
            run(`Valid #${index}: ${_case.description || _case.code}`, async () => {
              const { testcase, result } = await valid(_case)
              await cases?.onResult?.(testcase, result)
            })
          },
          )
        })
      }
      if (cases.invalid?.length) {
        describe('invalid', () => {
          cases.invalid!.forEach((c, index) => {
            const _case = normalizeTestCase(c, languageOptions, defaultFilenames, 'invalid')
            let run: typeof it | typeof it.only = it
            if (_case.only)
              run = it.only
            if (_case.skip)
              run = it.skip
            run(`Invalid #${index}: ${_case.description || _case.code}`, async () => {
              const { testcase, result } = await invalid(_case)
              await cases?.onResult?.(testcase, result)
            })
          })
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
