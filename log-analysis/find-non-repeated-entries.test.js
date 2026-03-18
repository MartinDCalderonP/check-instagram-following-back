import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  createEntriesMapByKey,
  createEntryKey,
  createPreviousEntriesSet,
  createUsersAddedInLatest,
  runAnalysis
} from './find-non-repeated-entries.js'

const entryKeyCases = [
  {
    expected: 'id:123',
    input: { id: '123', username: 'user123' },
    title: 'createEntryKey uses id when available'
  },
  {
    expected: 'username:user123',
    input: { id: '', username: 'user123' },
    title: 'createEntryKey falls back to username when id is missing'
  }
]

describe('find-non-repeated-entries', () => {
  entryKeyCases.forEach(({ expected, input, title }) => {
    test(title, () => {
      const key = createEntryKey(input)
      assert.equal(key, expected)
    })
  })

  test('createEntriesMapByKey deduplicates entries by key', () => {
    const entries = [
      { full_name: 'Nombre A', id: '1', username: 'a' },
      { full_name: 'Nombre A duplicado', id: '1', username: 'a' },
      { full_name: 'Nombre B', id: '2', username: 'b' }
    ]
    const map = createEntriesMapByKey({ entries })
    assert.equal(map.size, 2)
    assert.deepEqual(map.get('id:1'), { fullname: 'Nombre A', username: 'a' })
  })

  test('createPreviousEntriesSet includes keys from all previous logs', () => {
    const logs = [
      { entries: [{ id: '1', username: 'a' }], fileName: '2026-01-01.json' },
      { entries: [{ id: '2', username: 'b' }], fileName: '2026-02-01.json' },
      { entries: [{ id: '3', username: 'c' }], fileName: '2026-03-01.json' }
    ]

    const keys = createPreviousEntriesSet({
      latestFileName: '2026-03-01.json',
      logs
    })
    assert.equal(keys.has('id:1'), true)
    assert.equal(keys.has('id:2'), true)
    assert.equal(keys.has('id:3'), false)
  })

  test('createUsersAddedInLatest returns only users new in latest file', () => {
    const fileNames = ['2026-02-01.json', '2026-03-01.json']
    const logs = [
      {
        entries: [
          { full_name: 'Usuario Viejo', id: '1', username: 'viejo' },
          { full_name: 'Usuario Repetido', id: '2', username: 'repetido' }
        ],
        fileName: '2026-02-01.json'
      },
      {
        entries: [
          { full_name: 'Usuario Repetido', id: '2', username: 'repetido' },
          { full_name: 'Usuario Nuevo', id: '3', username: 'nuevo' },
          { full_name: 'Usuario Nuevo Duplicado', id: '3', username: 'nuevo' }
        ],
        fileName: '2026-03-01.json'
      }
    ]
    const result = createUsersAddedInLatest({ fileNames, logs })
    assert.equal(result.latestFileName, '2026-03-01.json')
    assert.deepEqual(result.users, [
      { fullname: 'Usuario Nuevo', username: 'nuevo' }
    ])
  })

  test('runAnalysis does not write output when there are no logs', () => {
    let mkdirCalled = false
    const logMessages = []
    let writeCalled = false
    const result = runAnalysis({
      collectLogsFn: () => ({ fileNames: [], logs: [] }),
      consoleRef: { log: (message) => logMessages.push(message) },
      mkdirSyncFn: () => {
        mkdirCalled = true
      },
      writeFileSyncFn: () => {
        writeCalled = true
      }
    })
    assert.equal(mkdirCalled, false)
    assert.equal(writeCalled, false)
    assert.equal(result.wroteFile, false)
    assert.match(logMessages[0], /No se encontraron logs para analizar/)
  })
})
