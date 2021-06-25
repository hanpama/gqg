import { DirectiveNode, GraphQLDirective, DirectiveLocation, GraphQLString } from 'graphql'
import { getArgumentValues } from 'graphql/execution/values'

export type ImportOption = { from: string, type?: string, }

export function getOneOrNoImportDirectiveValue(node: { directives?: readonly DirectiveNode[] }): ImportOption | null {
  const vals = getImportDirectiveValues(node)
  if (vals.length > 1) {
    throw new Error(``)
  }
  return vals[0] || null
}

export function getImportDirectiveValues(node: { directives?: readonly DirectiveNode[] }): ImportOption[] {
  const result: ImportOption[] = []

  for (const directive of (node.directives || [])) {
    if (directive.name.value === GraphQLImportDirective.name) {
      const { from, type } = getArgumentValues(GraphQLImportDirective, directive)
      result.push({ from, type })
    }
  }
  return result
}


export const GraphQLImportDirective = new GraphQLDirective({
  name: 'import',
  locations: [
    DirectiveLocation.FIELD_DEFINITION,
    DirectiveLocation.OBJECT,
    DirectiveLocation.INPUT_OBJECT,
    DirectiveLocation.INTERFACE,
    DirectiveLocation.UNION,
    DirectiveLocation.INPUT_FIELD_DEFINITION,
    DirectiveLocation.ARGUMENT_DEFINITION,
  ],
  args: {
    type: { type: GraphQLString },
    from: { type: GraphQLString },
  },
  isRepeatable: true,
})
