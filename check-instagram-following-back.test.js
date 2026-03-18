import { equal, deepEqual } from 'node:assert/strict'
import { describe, test } from 'node:test'

import { buildGraphQLUrl, collectUnfollowers, createUsersFilename, createInstagramFollowingChecker, getCookie } from './check-instagram-following-back'

const QUERY_HASH = '3dec7e2c57367ef3da3d987d89f9dbc8'
const USER_ID = '999'
const COOKIE_NAME = 'ds_user_id'

const cookieCases = [
  {
    cookieString: 'foo=bar; ds_user_id=12345; csrftoken=abc',
    expected: '12345',
    title: 'getCookie returns value when cookie exists'
  },
  {
    cookieString: 'foo=bar; csrftoken=abc',
    expected: undefined,
    title: 'getCookie returns undefined when cookie does not exist'
  }
]

const unfollowerCases = [
  {
    edges: [
      {
        node: { follows_viewer: true, full_name: 'A', id: '1', username: 'a' }
      },
      {
        node: { follows_viewer: false, full_name: 'B', id: '2', username: 'b' }
      }
    ],
    expected: [{ id: '2', full_name: 'B', username: 'b' }],
    title: 'collectUnfollowers filters users that do not follow back'
  },
  {
    edges: [],
    expected: [],
    title: 'collectUnfollowers returns empty list for empty input'
  }
]

const createResponses = () => {
  return [
    {
      data: {
        user: {
          edge_follow: {
            count: 3,
            edges: [
              {
                node: {
                  follows_viewer: false,
                  full_name: 'User 1',
                  id: '1',
                  username: 'u1'
                }
              },
              {
                node: {
                  follows_viewer: true,
                  full_name: 'User 2',
                  id: '2',
                  username: 'u2'
                }
              }
            ],
            page_info: { end_cursor: 'cursor-a', has_next_page: true }
          }
        }
      }
    },
    {
      data: {
        user: {
          edge_follow: {
            count: 3,
            edges: [
              {
                node: {
                  follows_viewer: false,
                  full_name: 'User 3',
                  id: '3',
                  username: 'u3'
                }
              }
            ],
            page_info: { end_cursor: null, has_next_page: false }
          }
        }
      }
    }
  ]
}

describe('check-instagram-following-back', () => {
  cookieCases.forEach(({ cookieString, expected, title }) => {
    test(title, () => {
      const result = getCookie({ cookieName: COOKIE_NAME, cookieString })
      equal(result, expected)
    })
  })

  test('buildGraphQLUrl includes expected variables', () => {
    const url = buildGraphQLUrl({ after: 'cursor-1', userId: USER_ID })
    const parsedUrl = new URL(url)
    const variables = JSON.parse(parsedUrl.searchParams.get('variables'))

    equal(parsedUrl.searchParams.get('query_hash'), QUERY_HASH)
    equal(variables.after, 'cursor-1')
    equal(variables.first, '24')
    equal(variables.id, USER_ID)
  })

  unfollowerCases.forEach(({ edges, expected, title }) => {
    test(title, () => {
      const result = collectUnfollowers({ edges })
      deepEqual(result, expected)
    })
  })

  test('createUsersFilename formats date as YYYY-MM-DD.json', () => {
    const date = new Date('2026-03-18T00:00:00')
    const result = createUsersFilename({ date })

    equal(result, '2026-03-18.json')
  })

  test('startScript processes pagination and downloads final JSON', async () => {
    const responses = createResponses()
    let downloaded
    const fixedDate = new Date('2026-03-18T00:00:00')
    const checker = createInstagramFollowingChecker({
      consoleRef: { clear: () => {}, log: () => {}, warn: () => {} },
      cookieString: `${COOKIE_NAME}=${USER_ID}`,
      dateRef: fixedDate,
      downloadJsonFile: ({ data, filename }) => {
        downloaded = { data, filename }
      },
      fetchFn: async () => ({ json: async () => responses.shift() }),
      randomFn: () => 0,
      setTimeoutFn: (callback) => callback()
    })

    const result = await checker.startScript()

    equal(downloaded.filename, '2026-03-18.json')
    deepEqual(
      downloaded.data.map(({ username }) => username),
      ['u1', 'u3']
    )
    equal(result.totalFollowedPeople, 3)
  })
})
