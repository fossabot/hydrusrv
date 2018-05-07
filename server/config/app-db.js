const path = require('path')

let appDbPath = process.env.APP_DB_PATH

if (appDbPath.startsWith('.')) {
  appDbPath = path.resolve(__dirname, '../..', appDbPath)
}

module.exports = {
  dbPath: appDbPath
}
