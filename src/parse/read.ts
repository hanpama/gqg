import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'graphql'
import { DefinitionNode } from 'graphql/language'


export type Directory = {
  name: string,
  files: File[],
  subdirectories: Directory[],
}

export type File = {
  name: string,
  definitions: DefinitionNode[],
}

export async function readDirectory(dirnname: string): Promise<Directory> {
  const entries = await statDirectory(dirnname)
  const promises: Array<Promise<void>> = []

  const subdirectories: Directory[] = []
  const files: File[] = []

  for (const entry of entries) {
    const nextName = path.join(dirnname, entry.basename)
    if (entry.stat.isDirectory()) {
      promises.push(readDirectory(nextName).then(child => { subdirectories.push(child) }))
    } else {
      promises.push(readFile(nextName).then(file => { files.push(file) }))
    }
  }
  await Promise.all(promises)

  return {
    name: path.basename(dirnname),
    files: files.sort((a, b) => a.name > b.name ? 1 : -1),
    subdirectories: subdirectories.sort((a, b) => a.name > b.name ? 1 : -1),
  }
}

async function readFile(filePath: string): Promise<File> {
  const bytes = await fs.promises.readFile(filePath)
  try {
    const document = parse(bytes.toString())
    return { name: path.basename(filePath), definitions: [...document.definitions] }
  } catch (e) {
    console.error(`Error while parsing ${filePath}`)
    throw e
  }
}

async function statDirectory(dirname: string) {
  const basenames = await fs.promises.readdir(dirname)
  return Promise.all(basenames.map(basename => readFileEntry(dirname, basename)))
}

async function readFileEntry(dirname: string, basename: string) {
  const filename = path.join(dirname, basename)
  const stat = await fs.promises.stat(filename)
  return { basename, stat }
}
