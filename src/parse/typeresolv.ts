import { Module, TypeExpression, ListTypeExpression, NonNullTypeExpression, NamedTypeExpression, Definition } from '../models'
import { TypeNode } from 'graphql'


export function resolveTypeNode(mod: Module, def: TypeNode, pathExpr: string | null | undefined): TypeExpression {
  switch (def.kind) {
    case "ListType":
      return new ListTypeExpression(resolveTypeNode(mod, def.type, pathExpr))
    case "NonNullType":
      return new NonNullTypeExpression(resolveTypeNode(mod, def.type, pathExpr))
    case "NamedType":
      return new NamedTypeExpression(resolveTypeName(mod, def.name.value, pathExpr))
  }
}
export function resolveTypeName(mod: Module, name: string, pathExpr: string | null | undefined): Definition {
  if (pathExpr) {
    return resolvePathExpression(mod, pathExpr).mustGetDefinition(name)
  }
  return resolveDefinitionRecursively(mod, name)
}

function getBySegments(mod: Module, segments: string[]): Module {
  if (segments.length === 0) return mod
  return getBySegments(mod.children.mustGet(segments[0]), segments.slice(1))
}

function resolvePathExpression(mod: Module, pathExpr: string): Module {
  const path = pathExpr.split('/')
  return getBySegments(mod.getRoot(), path)
}

function resolveDefinitionRecursively(mod: Module, defName: string): Definition {
  const def = mod.definitions.get(defName)
  if (!def) {
    const nextModule = mod.parent
    if (!nextModule) {
      throw new Error(`Cannot find definition ${defName} ${mod.getFullName() || '[ROOT]'}`)
    }
    return resolveDefinitionRecursively(nextModule, defName)
  }
  return def
}