const db = require('../database')
const config = require('../config/app')
const hydrusConfig = require('../config/hydrus')
const tagsModel = require('./tags')

const generateFilePath = (type, hash) => {
  if (type === 'thumbnail') {
    return `${config.url}${config.mediaBase}/thumbnails/${hash.toString('hex')}`
  }

  return `${config.url}${config.mediaBase}/original/${hash.toString('hex')}`
}

module.exports = {
  getById (id) {
    const file = db.app.prepare(
      `SELECT
        id,
        mime,
        size,
        width,
        height,
        hash
      FROM
        hydrusrv_files
      WHERE
        id = ?`
    ).get(id)

    if (file) {
      file.mime = hydrusConfig.availableMimeTypes[file.mime]
      file.mediaUrl = generateFilePath('original', file.hash)
      file.thumbnailUrl = generateFilePath('thumbnail', file.hash)
      delete file.hash
    }

    return file
  },
  get (page) {
    const files = db.app.prepare(
      `SELECT
        id,
        mime,
        size,
        width,
        height,
        hash
      FROM
        hydrusrv_files
      LIMIT
        ${config.resultsPerPage}
      OFFSET
        ${(page - 1) * config.resultsPerPage}`
    ).all()

    if (files.length) {
      for (const file of files) {
        file.mime = hydrusConfig.availableMimeTypes[file.mime]
        file.mediaUrl = generateFilePath('original', file.hash)
        file.thumbnailUrl = generateFilePath('thumbnail', file.hash)
        delete file.hash
      }
    }

    return files
  },
  getByTags (page, tags) {
    tags = [...new Set(tags)]

    const files = db.app.prepare(
      `SELECT
        hydrusrv_files.id,
        hydrusrv_files.mime,
        hydrusrv_files.size,
        hydrusrv_files.width,
        hydrusrv_files.height,
        hydrusrv_files.hash
      FROM
        hydrusrv_files
      LEFT JOIN
        hydrusrv_mappings
        ON hydrusrv_mappings.file_id = hydrusrv_files.id
      LEFT JOIN
        hydrusrv_tags
        ON hydrusrv_tags.id = hydrusrv_mappings.tag_id
      WHERE
        hydrusrv_tags.name IN (${',?'.repeat(tags.length).replace(',', '')})
      GROUP BY
        hydrusrv_files.id
      HAVING
        count(DISTINCT hydrusrv_tags.id) = ?
      LIMIT
        ${config.resultsPerPage}
      OFFSET
        ${(page - 1) * config.resultsPerPage}`
    ).all(tags, tags.length)

    if (files.length) {
      for (const file of files) {
        file.mime = hydrusConfig.availableMimeTypes[file.mime]
        file.mediaUrl = generateFilePath('original', file.hash)
        file.thumbnailUrl = generateFilePath('thumbnail', file.hash)
        delete file.hash
      }
    }

    return files
  },
  getSortedByNamespaces (page, namespaces) {
    namespaces = [...new Set(namespaces)]

    const validNamespaces = tagsModel.getNamespaces().map(
      namespace => namespace.name
    )

    namespaces = namespaces.filter(
      namespace => validNamespaces.includes(namespace)
    )

    if (!namespaces.length) {
      return this.get(page)
    }

    const namespaceOrderBys = []

    for (const namespace of namespaces) {
      namespaceOrderBys.push(
        `CASE
          WHEN namespace_${namespace.split(' ').join('_')} IS NULL THEN 1
          ELSE 0
        END,
        namespace_${namespace.split(' ').join('_')}`
      )
    }

    const files = db.app.prepare(
      `SELECT
        id,
        mime,
        size,
        width,
        height,
        hash
      FROM
        hydrusrv_files
      ORDER BY
        ${namespaceOrderBys.join(',')}, id
      LIMIT
        ${config.resultsPerPage}
      OFFSET
        ${(page - 1) * config.resultsPerPage}`
    ).all()

    if (files.length) {
      for (const file of files) {
        file.mime = hydrusConfig.availableMimeTypes[file.mime]
        file.mediaUrl = generateFilePath('original', file.hash)
        file.thumbnailUrl = generateFilePath('thumbnail', file.hash)
        delete file.hash
      }
    }

    return files
  },
  getByTagsSortedByNamespaces (page, tags, namespaces) {
    tags = [...new Set(tags)]
    namespaces = [...new Set(namespaces)]

    const validNamespaces = tagsModel.getNamespaces().map(
      namespace => namespace.name
    )

    namespaces = namespaces.filter(
      namespace => validNamespaces.includes(namespace)
    )

    if (!namespaces.length) {
      return this.getByTags(page, tags)
    }

    const namespaceOrderBys = []

    for (const namespace of namespaces) {
      namespaceOrderBys.push(
        `CASE
          WHEN namespace_${namespace.split(' ').join('_')} IS NULL THEN 1
          ELSE 0
        END,
        namespace_${namespace.split(' ').join('_')}`
      )
    }

    const files = db.app.prepare(
      `SELECT
        hydrusrv_files.id,
        hydrusrv_files.mime,
        hydrusrv_files.size,
        hydrusrv_files.width,
        hydrusrv_files.height,
        hydrusrv_files.hash
      FROM
        hydrusrv_files
      LEFT JOIN
        hydrusrv_mappings
        ON hydrusrv_mappings.file_id = hydrusrv_files.id
      LEFT JOIN
        hydrusrv_tags
        ON hydrusrv_tags.id = hydrusrv_mappings.tag_id
      WHERE
        hydrusrv_tags.name IN (${',?'.repeat(tags.length).replace(',', '')})
      GROUP BY
        hydrusrv_files.id
      HAVING
        count(DISTINCT hydrusrv_tags.id) = ?
      ORDER BY
        ${namespaceOrderBys.join(',')}, hydrusrv_files.id
      LIMIT
        ${config.resultsPerPage}
      OFFSET
        ${(page - 1) * config.resultsPerPage}`
    ).all(tags, tags.length)

    if (files.length) {
      for (const file of files) {
        file.mime = hydrusConfig.availableMimeTypes[file.mime]
        file.mediaUrl = generateFilePath('original', file.hash)
        file.thumbnailUrl = generateFilePath('thumbnail', file.hash)
        delete file.hash
      }
    }

    return files
  },
  getTotalCount () {
    return db.app.prepare(
      'SELECT COUNT(id) as count FROM hydrusrv_files'
    ).get()
  }
}
