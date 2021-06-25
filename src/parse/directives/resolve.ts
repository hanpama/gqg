import { DirectiveNode, getDirectiveValues, GraphQLDirective, DirectiveLocation, GraphQLBoolean } from 'graphql'

export type ResolveOption = { sync: boolean }

export function getResolveDirectiveValue(node: { directives?: readonly DirectiveNode[] }): ResolveOption | null {
  return getDirectiveValues(GraphQLResolveDirective, node) || null as any
}


export const GraphQLResolveDirective = new GraphQLDirective({
  name: 'resolve',
  locations: [
    DirectiveLocation.FIELD_DEFINITION,
  ],
  args: {
    sync: { type: GraphQLBoolean, defaultValue: false },
  },
  isRepeatable: false,
})
