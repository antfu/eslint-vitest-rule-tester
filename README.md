# eslint-vitest-rule-tester

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

ESLint rule tester with Vitest.

This module requires ESLint v9.0+.

## Install

```bash
npm i -D eslint-vitest-rule-tester
```

## Usage

### Classical Usage

Simliar style to ESLint's `TestRunner` (test cases with implicit test suites)

```ts
import { run } from 'eslint-vitest-rule-tester'

run('rule-name', rule, {
  valid: [
    // test cases
  ],
  invalid: [
    // test cases
  ],
}, {
  // the default flat configs
  configs: {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
  }
})
```

### Explicit Test Suites

```ts
import { createRuleTester } from 'eslint-vitest-rule-tester'
import { describe, expect, it } from 'vitest'

describe('rule-name', () => {
  const { valid, invalid } = createRuleTester({
    name: 'rule-name',
    rule,
    configs: {
      // flat config options
      languageOptions: {
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: 'module',
        },
      },
    }
  })

  it('valid case 1', () => {
    valid('const foo = 1')
  })

  it('invalid case 1 with snapshot', () => {
    const result = invalid({
      input: 'const foo = 1',
      errors: ['error-message-id'],
    })

    expect(result.output).toMatchSnapshot()
  })
})
```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2024-PRESENT [Anthony Fu](https://github.com/antfu)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/eslint-vitest-rule-tester?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/eslint-vitest-rule-tester
[npm-downloads-src]: https://img.shields.io/npm/dm/eslint-vitest-rule-tester?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/eslint-vitest-rule-tester
[bundle-src]: https://img.shields.io/bundlephobia/minzip/eslint-vitest-rule-tester?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=eslint-vitest-rule-tester
[license-src]: https://img.shields.io/github/license/antfu/eslint-vitest-rule-tester.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/antfu/eslint-vitest-rule-tester/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/eslint-vitest-rule-tester
