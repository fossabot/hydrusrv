const db = require('../database')
const config = require('../config/app')

module.exports = {
  get (page) {
    return db.app.prepare(
      `SELECT
        name,
        files
      FROM
        hydrusrv_tags
      ORDER BY
        name
      LIMIT
        ${config.resultsPerPage}
      OFFSET
        ${(page - 1) * config.resultsPerPage}`
    ).all()
  },
  getOfFile (fileId) {
    return db.app.prepare(
      `SELECT
        hydrusrv_tags.name,
        hydrusrv_tags.files
      FROM
        hydrusrv_tags
      LEFT JOIN
        hydrusrv_mappings
        ON
          hydrusrv_mappings.tag_id = hydrusrv_tags.id
      LEFT JOIN
        hydrusrv_files
        ON
          hydrusrv_files.id = hydrusrv_mappings.file_id
      WHERE
        hydrusrv_files.id = ?
      ORDER BY
        hydrusrv_tags.name`
    ).all(fileId)
  },
  complete (partialTag) {
    return db.app.prepare(
      `SELECT
        name,
        files
      FROM
        hydrusrv_tags
      WHERE
        name LIKE ?
      ORDER BY
        name
      LIMIT
        10`
    ).all(`%${partialTag}%`)
  },
  getNamespaces () {
    return db.app.prepare(
      'SELECT name FROM hydrusrv_namespaces ORDER BY name'
    ).all()
  },
  getTotalCount () {
    return db.app.prepare(
      'SELECT COUNT(name) as count FROM hydrusrv_tags'
    ).get()
  }
}
