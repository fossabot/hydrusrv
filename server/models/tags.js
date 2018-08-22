const db = require('../database')
const config = require('../config/app')

module.exports = {
  get (page, sort = 'id', direction = null) {
    const orderBy = this.generateOrderBy(sort, direction)

    return db.app.prepare(
      `SELECT
        name,
        file_count AS fileCount
      FROM
        hydrusrv_tags
      ORDER BY
        ${orderBy.method}
      LIMIT
        ${config.tagsPerPage}
      OFFSET
        ${(page - 1) * config.tagsPerPage}`
    ).all(...orderBy.params)
  },
  getContaining (page, contains, sort = 'id', direction = null) {
    const orderBy = this.generateOrderBy(sort, direction, contains)

    return db.app.prepare(
      `SELECT
        name,
        file_count AS fileCount
      FROM
        hydrusrv_tags
      WHERE
        name LIKE ?
      ORDER BY
        ${orderBy.method}
      LIMIT
        ${config.tagsPerPage}
      OFFSET
        ${(page - 1) * config.tagsPerPage}`
    ).all(`%${contains}%`, ...orderBy.params)
  },
  getOfFile (fileId) {
    return db.app.prepare(
      `SELECT
        hydrusrv_tags.name,
        hydrusrv_tags.file_count AS fileCount
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
        file_count AS fileCount
      FROM
        hydrusrv_tags
      WHERE
        name LIKE ?
      ORDER BY
        CASE
          WHEN name LIKE ? THEN 0
          ELSE 1
        END,
        name ASC
      LIMIT
        10`
    ).all(`%${partialTag}%`, `${partialTag}%`)
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
  },
  generateOrderBy (sort, direction, contains = null) {
    direction = ['asc', 'desc'].includes(direction) ? direction : null

    if (sort === 'contains' && contains) {
      return {
        method: `
          CASE
            WHEN name LIKE ? THEN 0
            ELSE 1
          END,
          name ${direction || 'ASC'}
        `,
        params: [`${contains}%`]
      }
    }

    switch (sort) {
      case 'name':
      case 'contains':
        return {
          method: `name ${direction || 'ASC'}`,
          params: []
        }
      case 'files':
        return {
          method: `file_count ${direction || 'DESC'}`,
          params: []
        }
      case 'random':
        return {
          method: 'random ASC',
          params: []
        }
      default:
        return {
          method: `id ${direction || 'DESC'}`,
          params: []
        }
    }
  }
}
