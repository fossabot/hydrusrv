const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
const logger = require('morgan')

const config = require('./server/config/app')
const db = require('./server/database')
const data = require('./server/helpers/data')

const app = express()

try {
  db.connect()
} catch (err) {
  console.error(
    'Could not connect to the databases. Make sure that the specified paths ' +
      'are correct and that the user running hydrusrv has the necessary ' +
      `permissions. Error:\n${err}`
  )

  process.exit(1)
}

const updateData = () => {
  try {
    data.sync()
  } catch (err) {
    console.error(`Could not create temporary data tables. Error:\n${err}`)

    process.exit(1)
  }
}

updateData()
setInterval(updateData, config.dataUpdateInterval * 1000)

if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'))
} else if (process.env.NODE_ENV === 'production' && config.loggingEnabled) {
  const accessLogStream = fs.createWriteStream(
    config.logfilePath, { flags: 'a' }
  )

  accessLogStream.on('error', () => {
    console.error(
      'Could not write logfile. Make sure that hydrusrv has write access to ' +
        'the specified logfile location or disable logging.'
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
      res.status(200).send('')

      return
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
