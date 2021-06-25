import { DirectiveLocation, DirectiveNode, GraphQLDirective, GraphQLString, parseType, TypeNode } from 'graphql'
import { getArgumentValues } from 'graphql/execution/values'


export type SourceOption = { name: string, type: TypeNode, from?: string }

export function getSourceDirectiveValues(node: { directives?: readonly DirectiveNode[] }): SourceOption[] {
  const result: SourceOption[] = []

  for (const directive of (node.directives || [])) {
    if (directive.name.value === GraphQLSourceDirective.name) {
      const { name, type, from } = getArgumentValues(GraphQLSourceDirective, directive)
      result.push({ name, type: parseType(type), from })
    }
  }
  return result
}

export const GraphQLSourceDirective = new GraphQLDirective({
  name: 'source',
  locations: [
    DirectiveLocation.FIELD_DEFINITION,
  ],
  args: {
    name: { type: GraphQLString },
    type: { type: GraphQLString },
    from: { type: GraphQLString },
  },
  isRepeatable: true,
})
