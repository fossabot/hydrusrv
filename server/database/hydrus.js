const Database = require('better-sqlite3')
const config = require('../config/hydrus-db')

module.exports = {
  connect () {
    this.conn = new Database(config.serverDbPath, {
      readonly: true,
      fileMustExist: true
    })

    this.conn.prepare(
      `ATTACH '${config.masterDbPath}' AS master_db;`
    ).run()
    this.conn.prepare(
      `ATTACH '${config.mappingsDbPath}' AS mappings_db;`
    ).run()
  }
}
