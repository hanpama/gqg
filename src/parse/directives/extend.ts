import { DirectiveNode, getDirectiveValues, GraphQLDirective, DirectiveLocation, GraphQLNonNull, GraphQLString } from 'graphql'

export type ExtendOption = { from?: string, name: string }

export function getExtendDirectiveValue(node: { directives?: readonly DirectiveNode[] }): ExtendOption | null {
  return getDirectiveValues(GraphQLExtendDirective, node) || null as any
}

export const GraphQLExtendDirective = new GraphQLDirective({
  name: 'extend',
  locations: [
    DirectiveLocation.OBJECT,
    DirectiveLocation.INPUT_OBJECT,
    DirectiveLocation.INTERFACE,
    DirectiveLocation.UNION,
  ],
  args: {
    name: { type: GraphQLNonNull(GraphQLString) },
    from: { type: GraphQLString },
  },
  isRepeatable: false,
})
