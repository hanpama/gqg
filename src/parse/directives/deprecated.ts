import { DirectiveNode, getDirectiveValues, GraphQLDeprecatedDirective } from 'graphql'

export function getDeprecationReason(node: { directives?: readonly DirectiveNode[] }): string | undefined {
  const result = getDirectiveValues(GraphQLDeprecatedDirective, node)
  return result?.reason
}