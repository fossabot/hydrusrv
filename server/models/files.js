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
  get (page, sort = 'id', namespaces) {
    const orderBy = this.generateOrderBy(sort, namespaces)

    if (!orderBy) {
      return this.get(page)
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
        ${orderBy}
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
  getByTags (page, tags, sort = 'id', namespaces) {
    tags = [...new Set(tags)]

    const orderBy = this.generateOrderBy(sort, namespaces)

    if (!orderBy) {
      return this.getByTags(page, tags)
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
        ${orderBy}
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
  },
  generateOrderBy (sort, namespaces) {
    if (sort === 'namespace' && namespaces.length) {
      const namespaceOrderBy = this.generateNamespaceOrderBy(namespaces)

      if (!namespaceOrderBy.length) {
        return undefined
      }

      return `${namespaceOrderBy.join(',')}, hydrusrv_files.id`
    }

    switch (sort) {
      case 'size':
        return 'hydrusrv_files.size DESC'
      case 'width':
        return 'hydrusrv_files.width DESC'
      case 'height':
        return 'hydrusrv_files.height DESC'
      case 'random':
        return 'hydrusrv_files.random ASC'
      default:
        return 'hydrusrv_files.id ASC'
    }
  },
  generateNamespaceOrderBy (namespaces) {
    namespaces = [...new Set(namespaces)]

    const validNamespaces = tagsModel.getNamespaces().map(
      namespace => namespace.name
    )

    namespaces = namespaces.filter(
      namespace => validNamespaces.includes(namespace)
    )

    if (!namespaces.length) {
      return []
    }

    const namespaceOrderBy = []

    for (const namespace of namespaces) {
      namespaceOrderBy.push(
        `CASE
          WHEN namespace_${namespace.split(' ').join('_')} IS NULL THEN 1
          ELSE 0
        END,
        namespace_${namespace.split(' ').join('_')}`
      )
    }

    return namespaceOrderBy
  }
}
