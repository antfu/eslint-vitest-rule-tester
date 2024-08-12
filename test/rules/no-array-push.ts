import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createEslintRule } from './_utils'

export const RULE_NAME = 'no-array-push'
export type MessageIds = 'noArrayPush'
export type Options = []

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent calling push on an array',
    },
    schema: [],
    messages: {
      noArrayPush: 'Don\'t call push on an array',
    },
  },
  defaultOptions: [],
  create: (context) => {
    return {
      CallExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression
          || node.callee.property.type !== AST_NODE_TYPES.Identifier
          || node.callee.property.name !== 'push') {
          return
        }

        if (!context.sourceCode.parserServices
          || !context.sourceCode.parserServices.program
          || !context.sourceCode.parserServices.esTreeNodeToTSNodeMap) {
          throw new Error('TypeScript not configured properly')
        }

        const typeChecker = context.sourceCode.parserServices.program.getTypeChecker()
        const tsNode = context.sourceCode.parserServices.esTreeNodeToTSNodeMap.get(
          node.callee.object,
        )
        const type = typeChecker.getTypeAtLocation(tsNode)

        if (type.symbol.name !== 'Array')
          return

        context.report({
          node,
          loc: node.callee.property.loc,
          messageId: 'noArrayPush',
        })
      },
    }
  },
})
