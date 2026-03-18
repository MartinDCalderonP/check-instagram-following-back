const translations = {
  en: {
    followingChecker: {
      completionTitle: '✅ ALL DONE!',
      completionUsersCount:
        '   👥 Total users not following back: {totalUnfollowers}',
      downloadedFile: '   📁 Downloaded file: {usersFilename}',
      longPause: '⏸️ 10-second pause to avoid temporary blocking',
      progress: '📊 Progress: {current}/{total} ({percentage}%)',
      progressListTitle: '👤 Users not following you back:',
      start: '🚀 Starting follower analysis...',
      warningFetchError: '⚠️ Error fetching followers data:'
    },
    logAnalysis: {
      fileGenerated: 'File generated: {outputFile}',
      noLogsFound: 'No logs found to analyze. No file was generated.',
      usersAddedInLatest: 'Users added in {latestFileName}: {usersCount}'
    }
  },
  es: {
    followingChecker: {
      completionTitle: '✅ ¡TODO LISTO!',
      completionUsersCount:
        '   👥 Total de usuarios que no te siguen: {totalUnfollowers}',
      downloadedFile: '   📁 Archivo descargado: {usersFilename}',
      longPause: '⏸️ Pausa de 10 segundos para evitar bloqueo temporal',
      progress: '📊 Progreso: {current}/{total} ({percentage}%)',
      progressListTitle: '👤 Usuarios que no te siguen de vuelta:',
      start: '🚀 Iniciando analisis de seguidores...',
      warningFetchError: '⚠️ Error al obtener datos de seguidores:'
    },
    logAnalysis: {
      fileGenerated: 'Archivo generado: {outputFile}',
      noLogsFound:
        'No se encontraron logs para analizar. No se genero archivo.',
      usersAddedInLatest: 'Usuarios agregados en {latestFileName}: {usersCount}'
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = translations
}
