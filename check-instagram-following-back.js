;(() => {
  const COOKIE_PARTS_LENGTH = 2
  const FETCH_FIRST_COUNT = 24
  const MAX_RANDOM_DELAY = 400
  const MIN_DELAY = 1000
  const QUERY_HASH = '3dec7e2c57367ef3da3d987d89f9dbc8'
  const SCROLL_CYCLES_BEFORE_BREAK = 6
  const SLEEP_TIME_TO_PREVENT_BLOCK = 10000
  const USERS_FILENAME = 'usersNotFollowingBack.json'

  const getCookie = (cookieName) => {
    const cookies = `; ${document.cookie}`
    const parts = cookies.split(`; ${cookieName}=`)

    if (parts.length === COOKIE_PARTS_LENGTH) {
      return parts.pop().split(';').shift()
    }
  }

  const sleep = (milliseconds) => {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds)
    })
  }

  const buildGraphQLUrl = (after = null) => {
    const variables = {
      id: userId,
      include_reel: 'true',
      fetch_mutual: 'false',
      first: `${FETCH_FIRST_COUNT}`
    }

    if (after) {
      variables.after = after
    }

    return `https://www.instagram.com/graphql/query/?query_hash=${QUERY_HASH}&variables=${JSON.stringify(variables)}`
  }

  const downloadJsonFile = ({ data, filename }) => {
    const jsonString = JSON.stringify(data)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  const logProgress = ({ current, total, unfollowers }) => {
    const percentage = Math.floor((current / total) * 100)

    console.clear()
    console.log(`📊 Progreso: ${current}/${total} (${percentage}%)`)
    console.log('👤 Usuarios que no te siguen de vuelta:')
    unfollowers.forEach((user) => {
      console.log(`   • ${user.username}`)
    })
  }

  const userId = getCookie('ds_user_id')

  let currentUrl = buildGraphQLUrl()
  let hasNextPage = true
  let processedCount = 0
  let scrollCycle = 0
  let totalFollowedPeople
  let unfollowersList = []

  const startScript = async () => {
    console.log('🚀 Iniciando análisis de seguidores...')

    while (hasNextPage) {
      let response

      try {
        response = await fetch(currentUrl).then((res) => res.json())
      } catch (error) {
        console.warn('⚠️ Error al obtener datos de seguidores:', error.message)
        continue
      }

      const followData = response?.data?.user?.edge_follow

      if (!totalFollowedPeople) {
        totalFollowedPeople = followData.count
      }

      hasNextPage = followData?.page_info?.has_next_page ?? false
      currentUrl = buildGraphQLUrl(followData.page_info.end_cursor)
      processedCount += followData.edges.length

      followData.edges.forEach((edge) => {
        if (!edge.node.follows_viewer) {
          unfollowersList.push({
            id: edge.node.id,
            username: edge.node.username,
            full_name: edge.node.full_name
          })
        }
      })

      logProgress({
        current: processedCount,
        total: totalFollowedPeople,
        unfollowers: unfollowersList
      })

      const randomDelay =
        Math.floor(Math.random() * MAX_RANDOM_DELAY) + MIN_DELAY
      await sleep(randomDelay)

      scrollCycle++

      if (scrollCycle > SCROLL_CYCLES_BEFORE_BREAK) {
        scrollCycle = 0
        console.log('⏸️ Pausa de 10 segundos para evitar bloqueo temporal')
        await sleep(SLEEP_TIME_TO_PREVENT_BLOCK)
      }
    }

    downloadJsonFile({
      data: unfollowersList,
      filename: USERS_FILENAME
    })

    console.log('═══════════════════════════════════════')
    console.log('✅ ¡TODO LISTO!')
    console.log('═══════════════════════════════════════')
    console.log(`   📁 Archivo descargado: ${USERS_FILENAME}`)
    console.log(
      `   👥 Total de usuarios que no te siguen: ${unfollowersList.length}`
    )
    console.log('═══════════════════════════════════════')
  }

  startScript()
})()
