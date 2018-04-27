const express = require('express')
const db = require('./server/database/hydrus')
const bodyParser = require('body-parser')
const logger = require('morgan')

// create new express app
const app = express()

// connect to hydrus databases
db.connect()

// set up logging
if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'))
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
      title: 'Error',
      name: 'NotFoundError',
      description: 'The requested resource does not exist.'
    }
  })
})

module.exports = app
