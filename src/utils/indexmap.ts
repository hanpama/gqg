export class IndexMap<T, K extends keyof T> {
  private innermap: Map<T[K], T> = new Map();
  constructor(private keyname: K, _typehint?: ({ new(...args: any[]): T })) { }

  static of<T, K extends keyof T>(keyname: K, ...values: T[]) {
    const map = new IndexMap<T, K>(keyname)
    for (const value of values) {
      map.add(value)
    }
    return map
  }

  add(value: T): T {
    this.innermap.set(value[this.keyname], value)
    return value
  }
  get(key: T[K]): T | undefined {
    return this.innermap.get(key)
  }
  mustGet(key: T[K]): T {
    if (!this.innermap.has(key)) {
      throw new Error(`Cannot get entry matching value of key "${this.keyname}" is "${key}"`)
    }
    return this.innermap.get(key) as T
  }
  values(): IterableIterator<T> {
    return this.innermap.values()
  }
}
