const path = require('path')

module.exports = {
  url: process.env.URL,
  port: parseInt(process.env.PORT, 10) | 8000,
  apiBase: process.env.API_BASE || '/api',
  mediaBase: process.env.MEDIA_BASE || '/media',
  registrationEnabled: process.env.REGISTRATION_ENABLED,
  minPasswordLength: process.env.MIN_PASSWORD_LENGTH || 16,
  loggingEnabled: process.env.LOGGING_ENABLED,
  logfilePath: process.env.LOGFILE_PATH ||
    path.resolve(__dirname, '../../logs/access.log')
}
