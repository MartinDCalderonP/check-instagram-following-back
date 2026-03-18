import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const BASE_DIR = resolve(__dirname, '..')
const LOGS_DIR = join(BASE_DIR, 'logs')
const OUTPUT_DIR = join(__dirname, 'output')
const OUTPUT_FILE = join(OUTPUT_DIR, 'non-repeated-entries.json')
const JSON_INDENT = 2

const readJsonFile = ({ filePath }) => {
  const content = readFileSync(filePath, 'utf8')
  return JSON.parse(content)
}

const createEntryKey = ({ id, username }) => {
  return id ? `id:${id}` : `username:${username}`
}

const createUserRecord = ({ full_name, username }) => {
  return { fullname: full_name ?? '', username: username ?? '' }
}

const collectLogs = ({ logsDir }) => {
  const fileNames = readdirSync(logsDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
  const logs = fileNames.map((fileName) => ({
    entries: readJsonFile({ filePath: join(logsDir, fileName) }),
    fileName
  }))

  return { fileNames, logs }
}

const createPreviousEntriesSet = ({ logs, latestFileName }) => {
  const keys = logs
    .filter(({ fileName }) => fileName !== latestFileName)
    .flatMap(({ entries }) =>
      entries.map(({ id, username }) => createEntryKey({ id, username }))
    )

  return new Set(keys)
}

const createEntriesMapByKey = ({ entries }) => {
  const entriesMapByKey = new Map()
  entries.forEach(({ full_name, id, username }) => {
    const key = createEntryKey({ id, username })
    if (entriesMapByKey.has(key)) return
    entriesMapByKey.set(key, createUserRecord({ full_name, username }))
  })
  return entriesMapByKey
}

const createUsersAddedInLatest = ({ fileNames, logs }) => {
  const latestFileName = fileNames[fileNames.length - 1]
  const latestEntries = logs.find(({ fileName }) => fileName === latestFileName)
  const previousEntriesSet = createPreviousEntriesSet({ logs, latestFileName })
  const latestEntriesMap = createEntriesMapByKey({
    entries: latestEntries.entries
  })
  const usersAddedInLatest = []
  latestEntriesMap.forEach((entry, key) => {
    if (previousEntriesSet.has(key)) return
    usersAddedInLatest.push(entry)
  })
  usersAddedInLatest.sort(({ username: aUsername }, { username: bUsername }) =>
    aUsername.localeCompare(bUsername)
  )
  return { latestFileName, users: usersAddedInLatest }
}

const runAnalysis = ({
  collectLogsFn = collectLogs,
  consoleRef = console,
  mkdirSyncFn = mkdirSync,
  writeFileSyncFn = writeFileSync
}) => {
  const { fileNames, logs } = collectLogsFn({ logsDir: LOGS_DIR })
  if (!fileNames.length) {
    consoleRef.log(
      'No se encontraron logs para analizar. No se genero archivo.'
    )
    return { latestFileName: null, users: [], wroteFile: false }
  }
  const { latestFileName, users } = createUsersAddedInLatest({
    fileNames,
    logs
  })
  mkdirSyncFn(OUTPUT_DIR, { recursive: true })
  writeFileSyncFn(OUTPUT_FILE, JSON.stringify(users, null, JSON_INDENT))
  consoleRef.log(`Archivo generado: ${OUTPUT_FILE}`)
  consoleRef.log(`Usuarios agregados en ${latestFileName}: ${users.length}`)
  return { latestFileName, users, wroteFile: true }
}

const main = () => runAnalysis({})

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === __filename

if (isDirectRun) main()
export {
  createEntriesMapByKey,
  createEntryKey,
  createPreviousEntriesSet,
  createUsersAddedInLatest,
  runAnalysis
}
