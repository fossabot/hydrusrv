const path = require('path')

module.exports = {
  url: process.env.URL,
  port: parseInt(process.env.PORT, 10) | 8000,
  apiBase: process.env.API_BASE || '/api',
  mediaBase: process.env.MEDIA_BASE || '/media',
  registrationEnabled: (process.env.REGISTRATION_ENABLED === 'true'),
  minPasswordLength: process.env.MIN_PASSWORD_LENGTH || 16,
  dataUpdateInterval: process.env.DATA_UPDATE_INTERVAL || 3600,
  resultsPerPage: process.env.RESULTS_PER_PAGE,
  loggingEnabled: (process.env.LOGGING_ENABLED === 'true'),
  logfilePath: process.env.OVERRIDE_LOGFILE_PATH ||
    path.resolve(__dirname, '../../logs/access.log'),
  allowCrossDomain: (process.env.ALLOW_CROSS_DOMAIN === 'true')
}
