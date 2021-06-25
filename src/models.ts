import { IndexMap } from './utils/indexmap'


export class Module {
  constructor(public segment: string, children: Module[]) {
    for (const child of children) {
      this.children.add(child)
      child.parent = this
    }
  }

  public parent: Module | null = null;
  public children = new IndexMap<Module, 'segment'>('segment');
  public definitions = new IndexMap<Definition, 'name'>('name');
  public extensions = new IndexMap<Extension, 'name'>('name');

  public query: ObjectDefinition | null = null;
  public mutation: ObjectDefinition | null = null;
  public subscription: ObjectDefinition | null = null;

  isRoot() { return !this.parent }
  getRoot(): Module { return this.parent ? this.parent.getRoot() : this }
  getSegmentPath(): string[] {
    if (this.parent) {
      return [...this.parent.getSegmentPath(), this.segment]
    }
    return []
  }

  addChild(child: Module): Module { return this.children.add(child) }
  mustGetChild(segment: string): Module { return this.children.mustGet(segment) }
  getChildren() { return Array.from(this.children.values()) }

  addDefinition(def: Definition) { return this.definitions.add(def) }
  getDefinitions(): Definition[] { return Array.from(this.definitions.values()) }
  mustGetDefinition(name: string): Definition { return this.definitions.mustGet(name) }
  getDefinitionTyped<T extends Definition>(name: string, type: { new(...args: any[]): T }): T {
    const def = this.definitions.mustGet(name)
    if (def instanceof type) {
      return def
    }
    throw new Error(`Definition of ${name} is not ${type.name}: got ${def.constructor.name}`)
  }

  addExtension(ext: Extension) { return this.extensions.add(ext) }
  getExtension(name: string) { return this.extensions.get(name) }
  getExtensions() { return Array.from(this.extensions.values()) }

  getFullName(): string | null {
    if (this.parent) {
      const parentName = this.parent.getFullName()
      return parentName ? `${parentName}_${this.segment}` : this.segment
    }
    return null
  }
}

export type Definition = ObjectDefinition | InputDefinition | InterfaceDefinition | ScalarDefinition | UnionTypeDefinition | EnumDefinition
export type Extension = ObjectExtension

export function isDefinitionType(obj: any): obj is Definition {
  return obj instanceof ObjectDefinition
    || obj instanceof InputDefinition
    || obj instanceof InterfaceDefinition
    || obj instanceof ScalarDefinition
    || obj instanceof UnionTypeDefinition
    || obj instanceof EnumDefinition
}

export class ObjectDefinition {
  static create(...args: ConstructorParameters<typeof ObjectDefinition>) {
    return args[0].addDefinition(new ObjectDefinition(...args));;
  }

  private fields: IndexMap<FieldDefinition, 'name'>
  private extensions: ObjectExtension[]

  constructor(
    public module: Module,
    public name: string,
    public description: string | undefined,
  ) {
    this.interfaces = []
    this.fields = new IndexMap('name')
    this.extensions = []
  }

  private interfaces: InterfaceDefinition[] = [];
  addInterface(i: InterfaceDefinition) {
    i.addPossibleType(this)
    this.interfaces.push(i)
  }
  getAllInterfaces() {
    const interfaces = this.interfaces
    for (const ext of this.extensions) {
      interfaces.push(...ext.getInterfaces())
    }
    return interfaces
  }

  addField(field: FieldDefinition) { this.fields.add(field) }
  getOwnFields() { return Array.from(this.fields.values()) }
  getAllFields() {
    const fields = Array.from(this.fields.values())
    for (const ext of this.extensions) {
      fields.push(...ext.getFields())
    }
    return fields
  }

  getSources() {
    const sources: Source[] = []
    for (const f of this.fields.values()) {
      sources.push(...f.sources)
    }
    return sources
  }

  getResolvers() {
    const resolvers: Resolver[] = []
    for (const f of this.fields.values()) {
      if (f.resolver) {
        resolvers.push(f.resolver)
      }
    }
    return resolvers
  }
  hasResolvers() {
    return this.getResolvers().length > 0
  }

  addExtension(e: ObjectExtension) {
    this.extensions.push(e)
  }

  getFullName() {
    return [this.module.getFullName(), this.name].filter(i => i).join('__')
  }
}

export class ScalarDefinition {
  constructor(
    public module: Module,
    public name: string,
    public description: string | undefined,
  ) { }

  getFullName() {
    return [this.module.getFullName(), this.name].filter(i => i).join('__')
  }

  isBuiltIn() {
    return this.module.isRoot() && (
      this.name === 'String'
      || this.name === 'Float'
      || this.name === 'ID'
      || this.name === 'Int'
      || this.name === 'Boolean'
    )
  }
}

export class ObjectExtension {
  static getOrCreate(module: Module, definition: ObjectDefinition, name: string,) {
    let ext = module.getExtension(name)
    if (!ext) {
      ext = new ObjectExtension(module, definition, name)
      module.addExtension(ext)
      definition.addExtension(ext)
    } else {
      if (ext.definition !== definition) {
        throw new Error(`Cannot create extension with same name for different definitions`)
      }
    }
    return ext
  }

  constructor(
    public module: Module,
    public definition: ObjectDefinition,
    public name: string,
  ) { }

  // get name() { return this.definition.name; }

  private interfaces: InterfaceDefinition[] = [];
  addInterface(i: InterfaceDefinition) {
    i.addPossibleType(this.definition)
    this.interfaces.push(i)
  }
  getInterfaces() { return this.interfaces }

  private fields = new IndexMap<FieldDefinition, 'name'>('name');
  addField(field: FieldDefinition) {
    return this.fields.add(field)
  }
  getFields() {
    return Array.from(this.fields.values())
  }

  hasResolvers() {
    return this.getResolvers().length > 0
  }

  getResolvers() {
    const resolvers: Resolver[] = []
    for (const f of this.fields.values()) {
      if (f.resolver) {
        resolvers.push(f.resolver)
      }
    }
    return resolvers
  }
}

export class InterfaceDefinition {
  static create(...args: ConstructorParameters<typeof InterfaceDefinition>) {
    return args[0].addDefinition(new InterfaceDefinition(...args));;
  }

  constructor(
    public module: Module,
    public name: string,
    public description: string | undefined,
  ) { }

  private possibleTypes: Array<ObjectDefinition | InterfaceDefinition> = [];
  addPossibleType(def: ObjectDefinition | InterfaceDefinition) {
    this.possibleTypes.push(def)
  }
  getPossibleTypes(): Set<ObjectDefinition> {
    const possibleConcreteTypes: ObjectDefinition[] = []
    for (const def of this.possibleTypes) {
      if (def instanceof ObjectDefinition) {
        possibleConcreteTypes.push(def)
      } else {
        possibleConcreteTypes.push(...def.getPossibleTypes())
      }
    }
    return new Set(possibleConcreteTypes)
  }

  private interfaces: InterfaceDefinition[] = [];
  addInterface(i: InterfaceDefinition) {
    i.addPossibleType(this)
    this.interfaces.push(i)
  }
  getInterfaces() { return this.interfaces }

  private fields = new IndexMap<FieldDefinition, 'name'>('name');
  addField(field: FieldDefinition) {
    return this.fields.add(field)
  }

  getAllFields() {
    return Array.from(this.fields.values())
  }

  getFullName() {
    return [this.module.getFullName(), this.name].filter(i => i).join('__')
  }
}

export class UnionTypeDefinition {
  static create(...args: ConstructorParameters<typeof UnionTypeDefinition>) {
    return args[0].addDefinition(new UnionTypeDefinition(...args));;
  }

  constructor(
    public module: Module,
    public name: string,
    public description: string | undefined,
  ) { }

  private types: Definition[] = [];
  addPossibleType(type: Definition) {
    this.types.push(type)
  }
  getPossibleTypes() {
    return new Set(this.types)
  }

  getFullName() {
    return [this.module.getFullName(), this.name].filter(i => i).join('__')
  }
}

export class InputDefinition {
  static create(...args: ConstructorParameters<typeof InputDefinition>) {
    return args[0].addDefinition(new InputDefinition(...args));;
  }

  constructor(
    public module: Module,
    public name: string,
    public description: string | undefined,
  ) { }

  private fields = new IndexMap<InputValueDefinition, 'name'>('name');

  addField(field: InputValueDefinition) {
    return this.fields.add(field)
  }

  getOwnFields() {
    return Array.from(this.fields.values())
  }

  /** 익스텐션까지 포함한 모든 필드 */
  getAllFields() {
    return Array.from(this.fields.values())
  }

  getFullName() {
    return [this.module.getFullName(), this.name].filter(i => i).join('__')
  }
}

export class EnumDefinition {
  static create(...args: ConstructorParameters<typeof EnumDefinition>) {
    return args[0].addDefinition(new EnumDefinition(...args));;
  }

  constructor(
    public module: Module,
    public name: string,
    public description: string | undefined,
    public values: Array<{
      name: string,
      description: string | undefined,
    }>,
  ) { }

  getFullName() {
    return [this.module.getFullName(), this.name].filter(i => i).join('__')
  }
}

export class FieldDefinition {
  constructor(
    public owner: ObjectDefinition | ObjectExtension | InterfaceDefinition,
    public name: string,
    public description: string | undefined,
    public args: InputValueDefinition[],
    public type: TypeExpression,
    public deprecationReason: string | undefined,
  ) { }

  public sources: Source[] = []
  public resolver: Resolver | null = null;

  public addSource(source: Source) { this.sources.push(source) }
  public setResolver(resolver: Resolver) { this.resolver = resolver }

  getFullName() {
    if (this.owner instanceof ObjectExtension) {
      // TODO: 이름구하는방법좀개선
      return [this.owner.module.getFullName(), this.name].filter(i => i).join('__')
    }
    return this.name
  }
}


export class InputValueDefinition {
  constructor(
    public name: string,
    public description: string | undefined,
    public type: TypeExpression,
    public defaultValue: any,
    public deprecationReason: string | undefined,
  ) { }
}

export type TypeExpression = NamedTypeExpression | ListTypeExpression | NonNullTypeExpression

export class NamedTypeExpression {
  constructor(
    public def: Definition,
  ) { }

  getName(): string { return this.def.name }
}

export class ListTypeExpression {
  constructor(
    public inner: TypeExpression
  ) { }

  getName(): string { return this.inner.getName() }
}

export class NonNullTypeExpression {
  constructor(
    public inner: TypeExpression
  ) { }

  getName(): string { return this.inner.getName() }
}


export class Source {
  static create(...args: ConstructorParameters<typeof Source>) {
    const instance = new Source(...args)
    args[0].addSource(instance)
    return instance
  }

  constructor(
    public owner: FieldDefinition,
    public name: string,
    public type: TypeExpression,
  ) { }
}

export class Resolver {
  static create(...args: ConstructorParameters<typeof Resolver>) {
    const instance = new Resolver(...args)
    args[0].setResolver(instance)
    return instance
  }

  constructor(
    public owner: FieldDefinition,
    // public sync: boolean,
  ) { }
}