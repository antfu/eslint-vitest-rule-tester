import path from 'node:path'
import tsParser from '@typescript-eslint/parser'
import { run } from '../../src'
import { common } from './no-array-push.cases'

// Using `projectService` - custom fixture.
run({
  ...common,
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      tsconfigRootDir: path.join(import.meta.dirname, './ts-fixture'),
      projectService: {
        // Ensure we're not using the default project
        maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 0,
      },
    },
  },
})
