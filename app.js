const fs = require('fs')
const express = require('express')
const db = require('./server/database/database')
const bodyParser = require('body-parser')
const logger = require('morgan')
const config = require('./server/config/app')

const app = express()

try {
  db.connect()
} catch (err) {
  console.error(
    'Could not connect to databases. Make sure the specified paths are ' +
      'correct and hydrusrv has write access to the databases.'
  )

  process.exit(1)
}

if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'))
} else if (process.env.NODE_ENV === 'production' && config.loggingEnabled) {
  const accessLogStream = fs.createWriteStream(
    config.logfilePath, { flags: 'a' }
  )

  accessLogStream.on('error', () => {
    console.error(
      'Could not write logfile. Make sure hydrusrv has write access to the ' +
        'specified logfile location or disable logging.'
    )

    process.exit(1)
  })

  app.use(logger('combined', { stream: accessLogStream }))
}

app.use(bodyParser.json())

if (config.allowCrossDomain) {
  const allowCrossDomain = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.header('Origin') || '*')

    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    )

    res.header(
      'Access-Control-Allow-Methods', 'GET, HEAD, PUT, POST, DELETE, OPTIONS'
    )

    if (req.method === 'OPTIONS') {
      res.send(200, '')
    }

    next()
  }

  app.use(allowCrossDomain)
}

require('./server/routes')(app)

app.use((err, req, res, next) => {
  res.status(err.customStatus || 500).json({
    error: err.customName || 'InternalServerError'
  })
})

app.use((req, res, next) => {
  res.status(404).json({
    error: 'NotFoundError'
  })
})

module.exports = app
