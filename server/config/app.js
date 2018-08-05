const path = require('path')

module.exports = {
  url: process.env.URL,
  port: process.env.PORT || 8000,
  apiBase: process.env.API_BASE || '/api',
  mediaBase: process.env.MEDIA_BASE || '/media',
  registrationEnabled: (process.env.REGISTRATION_ENABLED === 'true'),
  minPasswordLength: process.env.MIN_PASSWORD_LENGTH || 16,
  dataUpdateInterval: process.env.DATA_UPDATE_INTERVAL || 3600,
  filesPerPage: process.env.FILES_PER_PAGE || 42,
  tagsPerPage: process.env.TAGS_PER_PAGE || 42,
  loggingEnabled: (process.env.LOGGING_ENABLED === 'true'),
  logfilePath: process.env.OVERRIDE_LOGFILE_PATH ||
    path.resolve(__dirname, '../../logs/access.log'),
  allowCrossDomain: (process.env.ALLOW_CROSS_DOMAIN === 'true')
}
