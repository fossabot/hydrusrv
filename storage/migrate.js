const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const migrations = require('./migrations/runner')
const config = require('../server/config/app-db')

migrations.up(config.dbPath)
