const path = require('path')

module.exports = {
  url: process.env.URL,
  port: parseInt(process.env.PORT, 10) | 8000,
  apiBase: process.env.API_BASE || '/api',
  mediaBase: process.env.MEDIA_BASE || '/media',
  loggingEnabled: process.env.LOGGING_ENABLED,
  logfilePath: process.env.LOGFILE_PATH ||
    path.resolve(__dirname, '../../logs/access.log')
}
