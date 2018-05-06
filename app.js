const fs = require('fs')
const express = require('express')
const db = require('./server/database/database')
const bodyParser = require('body-parser')
const logger = require('morgan')
const config = require('./server/config/app')

// create new express app
const app = express()

// connect to databases
try {
  db.connect()
} catch (err) {
  console.error(
    'Could not connect to databases. Make sure the specified paths are ' +
      'correct and hydrusrv has write access to the databases.'
  )

  process.exit(1)
}

// set up logging
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

// parse request bodies as json
app.use(bodyParser.json())

// define routes
require('./server/routes')(app)

// handle errors
app.use((err, req, res, next) => {
  res.status(err.customStatus || 500).json({
    error: {
      title: err.customTitle || 'Error',
      name: err.customName || 'InternalServerError',
      description: err.customDescription || 'This should not happen.'
    }
  })
})

// handle 404
app.use((req, res, next) => {
  res.status(404).json({
    error: {
      title: 'Resource not found',
      name: 'NotFoundError',
      description: 'The requested resource does not exist.'
    }
  })
})

module.exports = app
