import { Directory } from './read'
import {
  Module,
  ObjectDefinition,
  InterfaceDefinition,
  InputDefinition,
  ObjectExtension,
  FieldDefinition,
  InputValueDefinition,
  ScalarDefinition,
  Source,
  Resolver,
  UnionTypeDefinition,
  isDefinitionType,
  EnumDefinition,
} from '../models'
import {
  ObjectTypeDefinitionNode,
  InterfaceTypeDefinitionNode,
  InputObjectTypeDefinitionNode,
  ObjectTypeExtensionNode,
  TypeNode,
  FieldDefinitionNode,
  InputValueDefinitionNode,
  valueFromASTUntyped,
  SchemaDefinitionNode,
  ScalarTypeDefinitionNode,
  GraphQLString,
  GraphQLID,
  GraphQLFloat,
  GraphQLInt,
  GraphQLBoolean,
  UnionTypeDefinitionNode,
  EnumTypeDefinitionNode
} from 'graphql'
import {
  getDeprecationReason,
  getImportDirectiveValues,
  getSourceDirectiveValues,
  getResolveDirectiveValue,
  ImportOption,
  getExtendDirectiveValue,
  getOneOrNoImportDirectiveValue,
} from './directives'
import { resolveTypeNode, resolveTypeName } from './typeresolv'



export function parseModule(dir: Directory) {
  const mod = createModuleFromDirectory(dir) // root

  for (const scalar of [GraphQLString, GraphQLID, GraphQLFloat, GraphQLInt, GraphQLBoolean]) {
    mod.addDefinition(new ScalarDefinition(mod, scalar.name, scalar.description || undefined))
  }

  appendDefinitions(mod, dir)
  parseElse(mod, dir)

  return mod
}

function createModuleFromDirectory(dir: Directory): Module {
  return new Module(dir.name, dir.subdirectories.map(createModuleFromDirectory))
}

function appendDefinitions(mod: Module, dir: Directory,) {
  for (const file of dir.files) {
    for (const node of file.definitions) {
      if (node.kind === 'ObjectTypeDefinition') {
        appendObjectTypeDefinition(mod, node)
      } else if (node.kind === 'InterfaceTypeDefinition') {
        appendInterfaceTypeDefinition(mod, node)
      } else if (node.kind === 'InputObjectTypeDefinition') {
        appendInputObjectTypeDefinition(mod, node,)
      } else if (node.kind === 'ScalarTypeDefinition') {
        appendScalarTypeDefinition(mod, node)
      } else if (node.kind === 'UnionTypeDefinition') {
        appendUnionTypeDefintiion(mod, node)
      } else if (node.kind === 'EnumTypeDefinition') {
        appendEnumTypeDefinition(mod, node)
      }
    }
  }
  for (const subdir of dir.subdirectories) {
    appendDefinitions(mod.mustGetChild(subdir.name), subdir)
  }
  return mod
}

function parseElse(mod: Module, dir: Directory,) {
  for (const file of dir.files) {
    for (const node of file.definitions) {
      if (node.kind === 'ObjectTypeDefinition') {
        const def = mod.getDefinitionTyped(node.name.value, ObjectDefinition)
        appendInterfaces(mod, def, node)
        appendFields(mod, def, node)

      } else if (node.kind === 'InterfaceTypeDefinition') {
        const def = mod.getDefinitionTyped(node.name.value, InterfaceDefinition)
        appendInterfaces(mod, def, node)
        appendFields(mod, def, node)

      } else if (node.kind === 'InputObjectTypeDefinition') {
        const def = mod.getDefinitionTyped(node.name.value, InputDefinition)
        appendInputFields(mod, def, node)

      } else if (node.kind === 'ObjectTypeExtension') {
        const def = appendObjectTypeExtension(mod, node)
        appendInterfaces(mod, def, node)
        appendFields(mod, def, node)
      } else if (node.kind === 'SchemaDefinition') {
        if (!mod.isRoot()) {
          throw new Error(`Schema Definition should be placed in the root module`)
        }
        setRootObjectTypes(mod, node)
      } else if (node.kind === 'UnionTypeDefinition') {
        const def = mod.getDefinitionTyped(node.name.value, UnionTypeDefinition)
        appendUnionTypes(mod, def, node)
      }
    }
  }

  for (const subdir of dir.subdirectories) {
    parseElse(mod.mustGetChild(subdir.name), subdir)
  }
  return mod
}

function setRootObjectTypes(mod: Module, node: SchemaDefinitionNode) {
  for (const opType of node.operationTypes) {

    const def = resolveTypeName(mod, opType.type.name.value, null)
    if (!(def instanceof ObjectDefinition)) {
      throw new Error(`Root object type should be an object type`)
    }
    switch (opType.operation) {
      case 'query': mod.query = def; break
      case 'mutation': mod.mutation = def; break
      case 'subscription': mod.subscription = def; break
    }
  }
}

function appendInterfaces(
  mod: Module,
  def: ObjectDefinition | InterfaceDefinition | ObjectExtension,
  node: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | ObjectTypeExtensionNode,
) {
  if (!node.interfaces) return
  const importOpts = getImportDirectiveValues(node)
  const pathMap = matchTypesAndImports(node.interfaces || [], importOpts)

  for (const i of node.interfaces) {
    const t = resolveTypeName(mod, i.name.value, pathMap.get(i))
    if (t instanceof InterfaceDefinition) {
      def.addInterface(t)
    } else {
      throw new Error()
    }
  }
}

function appendUnionTypes(
  mod: Module,
  def: UnionTypeDefinition,
  node: UnionTypeDefinitionNode,
) {
  const importOpts = getImportDirectiveValues(node)
  const types = node.types || []
  const pathMap = matchTypesAndImports(types || [], importOpts)

  for (const i of types) {
    const t = resolveTypeName(mod, i.name.value, pathMap.get(i))
    if (isDefinitionType(t)) {
      def.addPossibleType(t)
    } else {
      throw new Error()
    }
  }
}

function appendFields(
  mod: Module,
  def: ObjectDefinition | InterfaceDefinition | ObjectExtension,
  node: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | ObjectTypeExtensionNode,
) {
  if (!node.fields) return
  for (const f of node.fields) {
    def.addField(parseField(def, mod, f))
  }
}

function appendInputFields(mod: Module, owner: InputDefinition, node: InputObjectTypeDefinitionNode) {
  if (!node.fields) return
  for (const f of node.fields) {
    owner.addField(parseInputValue(mod, f))
  }
}

function appendObjectTypeDefinition(mod: Module, node: ObjectTypeDefinitionNode) {
  const name = node.name.value
  const description = node.description?.value
  return ObjectDefinition.create(mod, name, description)
}

function appendInterfaceTypeDefinition(mod: Module, node: InterfaceTypeDefinitionNode) {
  const name = node.name.value
  const description = node.description?.value
  return InterfaceDefinition.create(mod, name, description)
}

function appendInputObjectTypeDefinition(mod: Module, node: InputObjectTypeDefinitionNode) {
  const name = node.name.value
  const description = node.description?.value
  return InputDefinition.create(mod, name, description)
}

function appendUnionTypeDefintiion(mod: Module, node: UnionTypeDefinitionNode) {
  const name = node.name.value
  const description = node.description?.value
  return UnionTypeDefinition.create(mod, name, description)
}

function appendEnumTypeDefinition(
  mod: Module,
  node: EnumTypeDefinitionNode,
) {
  const name = node.name.value
  const description = node.description?.value
  const values = (node.values || []).map(value => {
    return {
      name: value.name.value,
      description: value.description?.value,
    }
  })

  return EnumDefinition.create(mod, name, description, values)
}

function appendObjectTypeExtension(mod: Module, node: ObjectTypeExtensionNode) {
  const name = node.name.value

  const extendOpt = getExtendDirectiveValue(node)

  const def = resolveTypeName(mod, name, extendOpt?.from)

  if (def instanceof ObjectDefinition) {
    if (def.module === mod) {
      return def
    }
    return ObjectExtension.getOrCreate(mod, def, extendOpt?.name || def.name)
  }
  throw new Error(`Extension target must by Object Definition but got: ${def.constructor.name}`)
}

function appendScalarTypeDefinition(mod: Module, node: ScalarTypeDefinitionNode) {
  mod.addDefinition(new ScalarDefinition(mod, node.name.value, node.description?.value))
}


function parseField(
  owner: ObjectDefinition | ObjectExtension | InterfaceDefinition,
  mod: Module,
  node: FieldDefinitionNode) {
  const name = node.name.value
  const description = node.description?.value
  const args = node.arguments?.map(iv => parseInputValue(mod, iv)) || []
  const importOpt = getOneOrNoImportDirectiveValue(node)
  const type = resolveTypeNode(mod, node.type, importOpt?.from)
  const deprecationReason = getDeprecationReason(node)
  const def = new FieldDefinition(owner, name, description, args, type, deprecationReason)

  const sourceOpts = getSourceDirectiveValues(node)
  for (const sourceOpt of sourceOpts) {
    Source.create(def, sourceOpt.name, resolveTypeNode(mod, sourceOpt.type, sourceOpt.from))
  }

  const resolve = getResolveDirectiveValue(node)
  if (resolve) {
    Resolver.create(def)
  }

  if ((node.arguments?.length || 0) > 0) { // args 있을 때
    // directive 아무것도 없는 필드는 비동기 리졸버임
    if (!resolve) {
      Resolver.create(def)
    }
  } else { // args 없을 때
    // directive 아무것도 없는 필드는 소스임
    if (!resolve && sourceOpts.length === 0) {
      Source.create(def, def.name, def.type)
    }
  }

  return def
}


function parseInputValue(mod: Module, node: InputValueDefinitionNode) {
  const name = node.name.value
  const description = node.description?.value

  const importOpt = getOneOrNoImportDirectiveValue(node)
  const type = resolveTypeNode(mod, node.type, importOpt?.from)

  const defaultValue = node.defaultValue
    ? valueFromASTUntyped(node.defaultValue,)
    : undefined
  const deprecatedReason = getDeprecationReason(node)

  return new InputValueDefinition(name, description, type, defaultValue, deprecatedReason)
}


/* 여러 임포트 옵션과 타입 노드를 매치해서 타입노드별 임포트 경로 맵을 만듬 */
function matchTypesAndImports(nodes: readonly TypeNode[], opts: readonly ImportOption[]): Map<TypeNode, string | null> {
  const result = new Map<TypeNode, string | null>()
  // 옵션이 더 긴 것은 말이 안 됨
  if (nodes.length < opts.length) {
    throw new Error(``)
  }
  // 타입이 하나인 경우
  if (nodes.length === 1) {
    if (opts.length > 0 && typeof opts[0].type === 'string' && opts[0].type !== getTypeName(nodes[0])) {
      // 하필 하나 임포트하는데 타입 이름을 잘못 쓴 경우
      throw new Error(`Cannot find type maching name ${opts[0].type}`)
    }
    result.set(nodes[0], opts[0]?.from || null)
    return result
  }

  const nodeMap: { [name: string]: TypeNode } = {}
  for (const node of nodes) {
    nodeMap[getTypeName(node)] = node
  }

  for (const { type, from } of opts) {
    if (!type) {
      throw new Error('Must specify all type arguments when use multiple imports')
    }

    const node = nodeMap[type]
    if (!node) {
      throw new Error(`Cannot find type maching name ${type}`)
    }
    result.set(node, from)
  }

  return result
}

function getTypeName(node: TypeNode): string {
  if (node.kind === 'ListType' || node.kind === 'NonNullType') {
    return getTypeName(node.type)
  }
  return node.name.value
}
