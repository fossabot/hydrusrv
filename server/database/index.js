const Database = require('better-sqlite3')

const appConfig = require('../config/app-db')
const hydrusConfig = require('../config/hydrus-db')

module.exports = {
  connect () {
    this.app = new Database(appConfig.dbPath, {
      fileMustExist: true
    })

    this.hydrus = new Database(hydrusConfig.serverDbPath, {
      readonly: true,
      fileMustExist: true
    })

    this.hydrus.prepare(
      `ATTACH '${hydrusConfig.masterDbPath}' AS master_db;`
    ).run()
    this.hydrus.prepare(
      `ATTACH '${hydrusConfig.mappingsDbPath}' AS mappings_db;`
    ).run()
  }
}
