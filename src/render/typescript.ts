import {
  Module,
  ObjectDefinition,
  InputDefinition,
  InterfaceDefinition,
  TypeExpression,
  ScalarDefinition,
  ListTypeExpression,
  NonNullTypeExpression,
  NamedTypeExpression,
  Resolver,
  InputValueDefinition,
  FieldDefinition,
  ObjectExtension,
  Definition,
  UnionTypeDefinition,
  EnumDefinition,
} from '../models'


export function renderFile(root: Module, indent = '  ') {

  const lines = [
    `// GENERATED: do not edit manually`,
    `import * as graphql from 'graphql';`,
    ...renderNamespace(root, indent),

    ...renderGraphQLSchemaCreatingFunction(root, indent),

  ].filter(i => i)

  return lines.join('\n')
}


function renderNamespace(mod: Module, indent: string): string[] {
  const lines: string[] = []

  lines.push(...renderNamespaceTypenames(mod, indent))
  lines.push(...renderNamespaceConfig(mod, indent))

  // 타입별 리졸버와 소스 등
  for (const def of mod.getDefinitions()) {
    if (def instanceof ObjectDefinition) {
      lines.push(...renderObjectSource(mod, def, indent))
      lines.push(...renderDefinitionResolver(mod, def, indent))
    } else if (def instanceof InputDefinition) {
      lines.push(...renderInputSource(mod, def, indent))
    } else if (def instanceof InterfaceDefinition) {
      lines.push(...renderInterfaceSource(mod, def))
    } else if (def instanceof ScalarDefinition) {
      if (!def.isBuiltIn()) {
        lines.push(...renderScalarConfig(mod, def, indent))
      }
    } else if (def instanceof UnionTypeDefinition) {
      // renderUnionTypeSource
      lines.push(`export type ${def.name}Source = ${Array.from(def.getPossibleTypes(), f => renderSourceName(mod, f)).join(' | ')
        }`)
    } else if (def instanceof EnumDefinition) {
      lines.push(`export type ${def.name}Source = ${def.values.map(value => `"${value.name}"`).join(' | ')}`)
    }
  }
  for (const ext of mod.getExtensions()) {
    lines.push(...renderExtensionResolver(mod, ext, indent))
  }
  for (const child of mod.getChildren()) {
    lines.push(
      `export namespace ${child.getFullName()} {`,
      ...renderNamespace(child, indent).map(i => indent + i),
      `}`
    )
  }

  return lines
}

function renderNamespaceTypenames(mod: Module, indent: string) {
  const lines = []
  for (const def of mod.getDefinitions()) {
    lines.push(`export const ${def.name}Typename = '${def.getFullName()}';`)

    if (def instanceof UnionTypeDefinition || def instanceof InterfaceDefinition) {

      lines.push(`export type ${def.name}TypenamePossible = ${Array.from(def.getPossibleTypes(), def => `'${def.getFullName()}'`).join(' | ')};`)
      lines.push(`export const ${def.name}TypenamePossible = new Set<${def.name}TypenamePossible>([${Array.from(def.getPossibleTypes(), def => `'${def.getFullName()}'`).join(', ')}]);`)

    }
  }
  return lines
}

function renderNamespaceConfig(mod: Module, indent: string) {
  const lines = []
  // 모듈 단위 리졸버
  const resolvers: Array<ObjectExtension | ObjectDefinition> = []
  const customScalars: Array<ScalarDefinition> = []

  for (const def of mod.getDefinitions()) {
    if (def instanceof ObjectDefinition) {
      resolvers.push(def)
    }
    if (def instanceof ScalarDefinition && !def.isBuiltIn()) {
      customScalars.push(def)
    }
  }
  for (const ext of mod.getExtensions()) {
    resolvers.push(ext)
  }

  lines.push(`export class Config<TContext> {`)
  lines.push(indent + `constructor(config: Config<TContext>) { Object.assign(this, config) }`,)
  for (const child of mod.getChildren()) {
    lines.push(indent + `${child.segment}!: ${child.segment}.Config<TContext>`)
  }
  for (const def of resolvers) {
    lines.push(indent + `${def.name}${def.hasResolvers() ? '!' : '?'}: ${def.name}Resolver<TContext>`)
  }
  for (const def of customScalars) {
    lines.push(indent + `${def.name}?: ${def.name}ScalarConfig`)
  }

  lines.push(`}`)

  return lines

}

function renderGraphQLSchemaCreatingFunction(root: Module, indent: string): string[] {
  const lines: string[] = []
  lines.push(`export function createGraphQLSchema<TContext>(config?: Config<TContext>): graphql.GraphQLSchema {`)

  lines.push(...renderGraphQLTypesCode(root, indent).map(l => indent + l))
  lines.push(...renderGraphQLSchemaCreatingFunctionReturn(root, indent).map(l => indent + l))

  lines.push('}')
  return lines
}

function renderGraphQLSchemaCreatingFunctionReturn(root: Module, indent: string): string[] {
  const lines: string[] = []
  lines.push(`return new graphql.GraphQLSchema({`)
  if (root.query) {
    lines.push(indent + `query: ${root.query.getFullName()}Type,`) // TODO: refactor type naming
  }
  if (root.mutation) {
    lines.push(indent + `mutation: ${root.mutation.getFullName()}Type,`) // TODO: refactor type naming
  }
  if (root.subscription) {
    lines.push(indent + `subscription: ${root.subscription.getFullName()}Type,`) // TODO: refactor type naming
  }
  lines.push(indent + `types: [`)
  for (const def of collectAllDefinitions(root)) {
    lines.push(indent + indent + `${def.getFullName()}Type,`)
  }
  lines.push(indent + ']')

  lines.push('});')
  return lines
}

function renderGraphQLTypesCode(mod: Module, indent: string): string[] {
  const lines = []

  for (const def of mod.getDefinitions()) {
    if (def instanceof ObjectDefinition) {
      lines.push(...renderGraphQLObjectTypeCode(mod, def, indent))
    } else if (def instanceof InputDefinition) {
      lines.push(...renderGraphQLInputTypeCode(mod, def, indent))
    } else if (def instanceof InterfaceDefinition) {
      lines.push(...renderGraphQLInterfaceTypeCode(mod, def, indent))
    } else if (def instanceof ScalarDefinition) {
      lines.push(...renderGraphQLScalarTypeCode(mod, def, indent))
    } else if (def instanceof UnionTypeDefinition) {
      lines.push(...renderGraphQLUnionTypeCode(mod, def, indent))
    } else if (def instanceof EnumDefinition) {
      lines.push(...renderGraphQLEnumTypeCode(mod, def, indent))
    }
  }
  for (const child of mod.getChildren()) {
    lines.push(...renderGraphQLTypesCode(child, indent))
  }


  return lines
}

function collectAllDefinitions(mod: Module): Definition[] {
  const defs = mod.getDefinitions()
  for (const child of mod.getChildren()) {
    defs.push(...collectAllDefinitions(child))
  }
  return defs
}

function renderObjectSource(mod: Module, def: ObjectDefinition, indent: string): string[] {
  return [
    `export interface ${def.name}Source {`,
    indent + `__typename?: "${def.getFullName()}"`,
    ...def.getSources().map(f => (
      indent + `readonly ${f.name}: ${renderTSType(mod, f.type)}`
    )),
    `}`,
  ]
}


function renderDefinitionResolver(mod: Module, def: ObjectDefinition, indent: string): string[] {
  return [
    `export class ${def.name}Resolver<TContext> {`,
    indent + `constructor(config: ${def.name}Resolver<TContext>) { Object.assign(this, config) }`,
    indent + '__type?: (source: any, context: TContext, info: graphql.GraphQLResolveInfo) => boolean',
    ...def.getResolvers().map(r => (
      indent + renderResolverField(mod, def, r)
    )),
    `}`
  ]
}

function renderExtensionResolver(mod: Module, ext: ObjectExtension, indent: string): string[] {
  return [
    `export class ${ext.name}Resolver<TContext> {`,
    indent + `constructor(config: ${ext.name}Resolver<TContext>) { Object.assign(this, config) }`,
    ...ext.getResolvers().map(r => (
      indent + renderResolverField(mod, ext.definition, r)
    )),
    `}`
  ]
}


function renderGraphQLObjectTypeCode(mod: Module, def: ObjectDefinition, indent: string): string[] {
  return [
    `const ${def.getFullName()}Type: graphql.GraphQLObjectType = new graphql.GraphQLObjectType({`,
    indent + `name: "${def.getFullName()}",`,
    indent + `description: ${JSON.stringify(def.description)},`,
    indent + `interfaces: () => [${def.getAllInterfaces().map(i => (
      `${renderTypeExpressionGraphQLCode(mod, new NamedTypeExpression(i))}`
      // TODO: 여기서 NamedType을 다시 만들 필요는 없을 듯
    ))}],`,
    indent + `isTypeOf: config?.${mod.getSegmentPath().concat(def.name).join('.')}?.__type,`,
    indent + `fields: () => ({`,
    ...renderGraphQLFieldMap(mod, def.getAllFields(), indent).map(l => indent + indent + l),
    indent + `}),`,
    `})`,
  ]
}

function renderResolverField(mod: Module, sourceDef: ObjectDefinition, r: Resolver): string[] {
  const returnType = stripNonNulls(r.owner.type)

  return [
    `${r.owner.name}!: (src:  ${renderSourceName(mod, sourceDef)}, args: {` +
    r.owner.args.map(a => (
      ` ${a.name}: ${renderTSType(mod, a.type)}`
    )).join(',') +
    `}, ` +
    `context: TContext, info: graphql.GraphQLResolveInfo) => ` +
    `${renderTSType(mod, returnType)} | Promise<${renderTSType(mod, returnType)}>`
  ]
}

function renderInputSource(mod: Module, def: InputDefinition, indent: string): string[] {
  return [
    `export interface ${def.name}Source {`,
    ...def.getAllFields().map(f => (
      indent + `readonly ${f.name}: ${renderTSType(mod, f.type)}`
    )),
    `}`
  ]
}

function renderGraphQLInputTypeCode(mod: Module, def: InputDefinition, indent: string): string[] {
  return [
    `const ${def.getFullName()}Type: graphql.GraphQLInputObjectType = new graphql.GraphQLInputObjectType({`,
    indent + `name: "${def.getFullName()}",`,
    indent + `description: ${JSON.stringify(def.description)},`,
    indent + `fields: () => ({`,
    ...renderGraphQLInputValueMap(mod, def.getAllFields(), indent).map(l => indent + indent + l),
    indent + `})`,
    `})`,
  ]
}

function renderInterfaceSource(mod: Module, def: InterfaceDefinition): string[] {
  let possibleTypeNamees: string[] = []
  for (const pdef of def.getPossibleTypes()) {
    possibleTypeNamees.push(renderSourceName(mod, pdef))
  }
  return [`export type ${def.name}Source = ${possibleTypeNamees.join(' | ')}`]
}

function renderScalarConfig(mod: Module, def: ScalarDefinition, indent: string): string[] {
  return [
    `export class ${def.name}ScalarConfig<TExternal=any, TInternal=any> {`,
    indent + `constructor(config: ${def.name}ScalarConfig<TExternal, TInternal>) { Object.assign(this, config) }`,
    indent + `serialize?: graphql.GraphQLScalarSerializer<TExternal>`,
    // Parses an externally provided value to use as an input.
    indent + `parseValue?: graphql.GraphQLScalarValueParser<TInternal>`,
    // Parses an externally provided literal value to use as an input.
    indent + `parseLiteral?: graphql.GraphQLScalarLiteralParser<TInternal>`,
    `}`
  ]
}

function renderGraphQLInterfaceTypeCode(mod: Module, def: InterfaceDefinition, indent: string): string[] {
  return [
    `const ${def.getFullName()}Type: graphql.GraphQLInterfaceType = new graphql.GraphQLInterfaceType({`,
    indent + `name: "${def.getFullName()}",`,
    indent + `description: ${JSON.stringify(def.description)},`,
    indent + `interfaces: () => [${def.getInterfaces().map(i => (
      `${renderTypeExpressionGraphQLCode(mod, new NamedTypeExpression(i))}`
    ))}],`,
    indent + `fields: () => ({`,
    ...renderGraphQLFieldMap(mod, def.getAllFields(), indent).map(l => indent + indent + l),
    indent + `}),`,
    `})`,
  ]
}

function renderGraphQLScalarTypeCode(mod: Module, def: ScalarDefinition, indent: string): string[] {
  if (def.isBuiltIn()) {
    return [
      `const ${def.getFullName()}Type = graphql.GraphQL${def.name}`
    ]
  }
  return [
    `const ${def.getFullName()}Type: graphql.GraphQLScalarType = new graphql.GraphQLScalarType({`,
    indent + `name: "${def.getFullName()}",`,
    indent + `description: ${JSON.stringify(def.description)},`,
    indent + `...(config && config.${mod.getSegmentPath().concat(def.name).join('.')})`,
    `})`,
  ]
}


function renderGraphQLUnionTypeCode(mod: Module, def: UnionTypeDefinition, indent: string): string[] {
  return [
    `const ${def.getFullName()}Type: graphql.GraphQLUnionType = new graphql.GraphQLUnionType({`,
    indent + `name: "${def.getFullName()}",`,
    indent + `description: ${JSON.stringify(def.description)},`,
    indent + `types: () => [${Array.from(def.getPossibleTypes(), i => (
      `${renderTypeExpressionGraphQLCode(mod, new NamedTypeExpression(i))}`
      // TODO: 여기서 NamedType을 다시 만들 필요는 없을 듯
    ))}],`,
    `})`,
  ]
}

function renderGraphQLEnumTypeCode(mod: Module, def: EnumDefinition, indent: string): string[] {
  return [
    `const ${def.getFullName()}Type: graphql.GraphQLEnumType = new graphql.GraphQLEnumType({`,
    indent + `name: "${def.getFullName()}",`,
    indent + `description: ${JSON.stringify(def.description)},`,
    indent + `values: {`,
    ...def.values.map(value => (
      indent + indent + `${value.name}: { description: ${JSON.stringify(value.description)} },`
    )),
    indent + `},`,
    `})`,
  ]
}

function renderGraphQLFieldMap(mod: Module, defs: FieldDefinition[], indent: string): string[] {
  const lines: string[] = []
  for (const def of defs) {
    lines.push(
      `${def.getFullName()}: { `,
      ...renderGraphQLField(mod, def, indent).map(i => indent + i),
      '},'
    )
  }
  return lines
}

function renderGraphQLField(mod: Module, def: FieldDefinition, indent: string): string[] {

  // 이 메서드는 mod 내 정의가 가진 필드를 모두 선택(extension까지 포함)해서 실행되다보니 mod가 필드 정의된
  // 모듈과 다를 수 있음
  const fieldMod = def.owner.module

  const lines = [
    `type: ${renderTypeExpressionGraphQLCode(mod, def.type)}, ` +
    `description: ${JSON.stringify(def.description)}, ` +
    `deprecationReason: ${JSON.stringify(def.deprecationReason)}, ` +
    `args: {` + renderGraphQLInputValueMap(mod, def.args, indent).map(l => indent + l).join(' ') + `},`,
  ]
  if (def.resolver) {
    lines.push(`resolve: config && config.${fieldMod.getSegmentPath().concat(def.owner.name).join('.')}.${def.name} as any,`)
  }
  return lines
}

function renderGraphQLInputValueMap(mod: Module, defs: InputValueDefinition[], indent: string): string[] {
  return defs.map(field => (
    `${field.name}: { ` +
    `type: ${renderTypeExpressionGraphQLCode(mod, field.type)}, ` +
    `defaultValue: ${JSON.stringify(field.defaultValue)}, ` +
    `description: ${JSON.stringify(field.description)} ` +
    `},`
  ))
}

function renderName(mod: Module, def: Definition) {
  if (def.module.isRoot() || def.module === mod) {
    return def.name
  }
  return def.module.getFullName() + '.' + def.name
}

function renderSourceName(mod: Module, def: Definition) {
  return renderName(mod, def) + 'Source'
}

function renderTSType(mod: Module, type: TypeExpression) {
  return renderTypeExpressionJSType(mod, type)
}

function renderTypeExpressionJSType(mod: Module, type: TypeExpression): string {
  if (type instanceof NonNullTypeExpression) {
    const inner = type.inner
    if (inner instanceof NamedTypeExpression) {
      return renderNamedType(mod, inner)
    }
    if (inner instanceof ListTypeExpression) {
      return `ReadonlyArray<${renderTypeExpressionJSType(mod, inner.inner)}>`
    }
    throw new Error('Unreachable')
  }
  if (type instanceof ListTypeExpression) {
    return `ReadonlyArray<${renderTypeExpressionJSType(mod, type.inner)}> | null | undefined`
  }
  return `${renderNamedType(mod, type)} | null | undefined`
}

function getTSType(name: string): string {
  switch (name) {
    case 'ID': return 'string'
    case 'Int': return 'number'
    case 'Float': return 'number'
    case 'Boolean': return 'boolean'
    case 'String': return 'string'
  }
  return 'any'
}

function renderNamedType(mod: Module, t: NamedTypeExpression): string {
  if (t.def instanceof ScalarDefinition) {
    return getTSType(t.def.name)
  }
  return renderSourceName(mod, t.def)
}

function renderTypeExpressionGraphQLCode(mod: Module, type: TypeExpression): string {
  if (type instanceof ListTypeExpression) {
    return `new graphql.GraphQLList(${renderTypeExpressionGraphQLCode(mod, type.inner)})`
  }
  else if (type instanceof NonNullTypeExpression) {
    return `new graphql.GraphQLNonNull(${renderTypeExpressionGraphQLCode(mod, type.inner)})`
  }
  return `${type.def.getFullName()}Type`
}

function stripNonNulls(type: TypeExpression): TypeExpression {
  if (type instanceof NonNullTypeExpression) {
    return stripNonNulls(type.inner)
  }
  if (type instanceof ListTypeExpression) {
    return new ListTypeExpression(stripNonNulls(type.inner))
  }
  return type
}
