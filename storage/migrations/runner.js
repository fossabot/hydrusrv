const db = require('sqlite')

module.exports = {
  async up (dbPath) {
    try {
      await db.open(dbPath)

      await db.migrate({
        force: 'last',
        migrationsPath: __dirname
      })
    } catch (err) {
      console.error(err)
    }
  }
}
