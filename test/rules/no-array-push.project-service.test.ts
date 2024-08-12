import tsParser from '@typescript-eslint/parser'
import { run } from '../../src'
import { common } from './no-array-push.cases'

// Using `projectService` - default project.
run({
  ...common,
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.ts'],
      },
    },
  },
})
