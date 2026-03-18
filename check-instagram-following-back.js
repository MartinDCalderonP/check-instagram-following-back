;(() => {
  const COOKIE_PARTS_LENGTH = 2
  const FETCH_FIRST_COUNT = 24
  const MAX_RANDOM_DELAY = 400
  const MIN_DELAY = 1000
  const QUERY_HASH = '3dec7e2c57367ef3da3d987d89f9dbc8'
  const SCROLL_CYCLES_BEFORE_BREAK = 6
  const SLEEP_TIME_TO_PREVENT_BLOCK = 10000
  const DATE_PART_LENGTH = 2
  const DEFAULT_LOCALE = 'en'
  const BANNER_LINE = '═══════════════════════════════════════'

  const formatMessage = ({ params, template }) => {
    return Object.entries(params).reduce((output, [key, value]) => {
      return output.replaceAll(`{${key}}`, `${value}`)
    }, template)
  }

  let translations
  if (typeof module !== 'undefined' && module.exports) {
    translations = require('./translations')
  } else {
    translations = globalThis.translations
  }

  const getLocaleMessages = ({ locale = DEFAULT_LOCALE }) => {
    return (translations[locale] ?? translations[DEFAULT_LOCALE])
      .followingChecker
  }

  const createUsersFilename = ({ date }) => {
    const day = `${date.getDate()}`.padStart(DATE_PART_LENGTH, '0')
    const month = `${date.getMonth() + 1}`.padStart(DATE_PART_LENGTH, '0')
    const year = `${date.getFullYear()}`

    return `${year}-${month}-${day}.json`
  }

  const getCookie = ({ cookieName, cookieString }) => {
    const cookies = `; ${cookieString}`
    const parts = cookies.split(`; ${cookieName}=`)

    if (parts.length === COOKIE_PARTS_LENGTH) {
      return parts.pop().split(';').shift()
    }

    return undefined
  }

  const sleep = ({ milliseconds, setTimeoutFn }) => {
    return new Promise((resolve) => {
      setTimeoutFn(resolve, milliseconds)
    })
  }

  const createInstagramGraphQLUrl = ({ queryHash, variables }) => {
    const url = new URL('https://www.instagram.com/graphql/query/')
    url.searchParams.set('query_hash', queryHash)
    url.searchParams.set('variables', JSON.stringify(variables))

    return url.toString()
  }

  const buildGraphQLUrl = ({ after, userId }) => {
    const variables = {
      fetch_mutual: 'false',
      first: `${FETCH_FIRST_COUNT}`,
      id: userId,
      include_reel: 'true'
    }

    if (after) variables.after = after

    return createInstagramGraphQLUrl({ queryHash: QUERY_HASH, variables })
  }

  const collectUnfollowers = ({ edges }) => {
    return edges
      .filter(({ node }) => !node.follows_viewer)
      .map(({ node }) => ({
        id: node.id,
        full_name: node.full_name,
        username: node.username
      }))
  }

  const createInstagramFollowingChecker = ({
    consoleRef,
    cookieString,
    dateRef,
    downloadJsonFile,
    fetchFn,
    localeRef,
    randomFn,
    setTimeoutFn
  }) => {
    const activeConsole = consoleRef ?? console
    const activeCookieString = cookieString ?? ''
    const activeDateRef = dateRef ?? new Date()
    const activeRandomFn = randomFn ?? Math.random
    const activeSetTimeoutFn = setTimeoutFn ?? setTimeout
    const userId = getCookie({
      cookieName: 'ds_user_id',
      cookieString: activeCookieString
    })
    const usersFilename = createUsersFilename({ date: activeDateRef })
    const {
      completionTitle,
      completionUsersCount,
      downloadedFile,
      longPause,
      progress,
      progressListTitle,
      start,
      warningFetchError
    } = getLocaleMessages({ locale: localeRef })

    let currentUrl = buildGraphQLUrl({ after: null, userId })
    let hasNextPage = true
    let processedCount = 0
    let scrollCycle = 0
    let totalFollowedPeople
    let unfollowersList = []

    const wait = ({ milliseconds }) => {
      return sleep({ milliseconds, setTimeoutFn: activeSetTimeoutFn })
    }

    const logProgress = ({ current, total, unfollowers }) => {
      const percentage = Math.floor((current / total) * 100)

      activeConsole.clear()
      activeConsole.log(
        formatMessage({
          params: { current, percentage, total },
          template: progress
        })
      )
      activeConsole.log(progressListTitle)
      unfollowers.forEach(({ username }) => {
        activeConsole.log(`   • ${username}`)
      })
    }

    const logCompletion = ({ totalUnfollowers }) => {
      activeConsole.log(BANNER_LINE)
      activeConsole.log(completionTitle)
      activeConsole.log(BANNER_LINE)
      activeConsole.log(
        formatMessage({
          params: { usersFilename },
          template: downloadedFile
        })
      )
      activeConsole.log(
        formatMessage({
          params: { totalUnfollowers },
          template: completionUsersCount
        })
      )
      activeConsole.log(BANNER_LINE)
    }

    const startScript = async () => {
      activeConsole.log(start)

      while (hasNextPage) {
        let response

        try {
          response = await fetchFn(currentUrl).then((res) => res.json())
        } catch ({ message }) {
          activeConsole.warn(warningFetchError, message)
          continue
        }

        const followData = response?.data?.user?.edge_follow

        if (!totalFollowedPeople) totalFollowedPeople = followData.count

        hasNextPage = followData?.page_info?.has_next_page ?? false
        currentUrl = buildGraphQLUrl({
          after: followData.page_info.end_cursor,
          userId
        })
        processedCount += followData.edges.length
        unfollowersList = [
          ...unfollowersList,
          ...collectUnfollowers({ edges: followData.edges })
        ]

        logProgress({
          current: processedCount,
          total: totalFollowedPeople,
          unfollowers: unfollowersList
        })

        const randomDelay =
          Math.floor(activeRandomFn() * MAX_RANDOM_DELAY) + MIN_DELAY
        await wait({ milliseconds: randomDelay })

        scrollCycle++

        if (scrollCycle > SCROLL_CYCLES_BEFORE_BREAK) {
          scrollCycle = 0
          activeConsole.log(longPause)
          await wait({ milliseconds: SLEEP_TIME_TO_PREVENT_BLOCK })
        }
      }

      downloadJsonFile({ data: unfollowersList, filename: usersFilename })
      logCompletion({ totalUnfollowers: unfollowersList.length })

      return { totalFollowedPeople, unfollowersList }
    }

    return { startScript }
  }

  const browserDownloadJsonFile = ({ data, filename }) => {
    const jsonString = JSON.stringify(data)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      buildGraphQLUrl,
      collectUnfollowers,
      createUsersFilename,
      createInstagramFollowingChecker,
      getCookie
    }
    return
  }

  const checker = createInstagramFollowingChecker({
    consoleRef: console,
    cookieString: document.cookie,
    downloadJsonFile: browserDownloadJsonFile,
    fetchFn: fetch,
    localeRef:
      (globalThis.window !== undefined &&
        globalThis.__CHECK_FOLLOWING_LOCALE__) ||
      DEFAULT_LOCALE,
    randomFn: Math.random,
    setTimeoutFn: setTimeout
  })

  checker.startScript()
})()
