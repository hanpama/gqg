import * as fs from 'fs'

import { renderFile } from './render/typescript'
import { readDirectory } from './parse/read'
import { parseModule } from './parse/parse'


async function main() {
  const inDir = process.argv[2]
  const outFile = process.argv[3]

  const rootDirectory = await readDirectory(inDir)
  const root = parseModule(rootDirectory)

  try {
    await fs.promises.writeFile(outFile, renderFile(root))
  } catch (e) {
    console.error("Failed to build schema: check the debug.json AST for debugging")
    throw e
  }
}

if (require.main === module) {
  main().catch(console.error)
}