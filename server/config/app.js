module.exports = {
  url: process.env.URL,
  port: parseInt(process.env.PORT, 10) | 8000,
  apiBase: process.env.API_BASE || '/api',
  mediaBase: process.env.MEDIA_BASE || '/media',
  registrationAllowed: process.env.REGISTRATION_ALLOWED
}
