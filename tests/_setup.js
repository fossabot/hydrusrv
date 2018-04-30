const path = require('path')

module.exports = {
  setTestEnvironment () {
    process.env.NODE_ENV = 'test'

    process.env.API_BASE = '/api'
    process.env.MEDIA_BASE = '/media'

    process.env.LOGGING_ENABLED = false
    process.env.LOGFILE_PATH = path.resolve(
      __dirname, '../server/logs/access.log'
    )

    process.env.HYDRUS_SERVER_DB_PATH = path.resolve(
      __dirname, 'hydrus-server-dummy-304/server.db'
    )
    process.env.HYDRUS_MASTER_DB_PATH = path.resolve(
      __dirname, 'hydrus-server-dummy-304/server.master.db'
    )
    process.env.HYDRUS_MAPPINGS_DB_PATH = path.resolve(
      __dirname, 'hydrus-server-dummy-304/server.mappings.db'
    )

    process.env.HYDRUS_FILES_PATH = path.resolve(
      __dirname, 'hydrus-server-dummy-304/server_files'
    )
    process.env.HYDRUS_TAG_REPOSITORY = 2
    process.env.HYDRUS_FILE_REPOSITORY = 3
    process.env.HYDRUS_SUPPORTED_MIME_TYPES = '1,2,3,4,14,21,23'
    process.env.HYDRUS_RESULTS_PER_PAGE = 4
  }
}