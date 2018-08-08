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
  get (page, sort = 'id', direction = null, namespaces = []) {
    const orderBy = this.generateOrderBy(sort, direction, namespaces)

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
        ${config.filesPerPage}
      OFFSET
        ${(page - 1) * config.filesPerPage}`
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
  getByTags (page, tags, sort = 'id', direction = null, namespaces = []) {
    tags = [...new Set(tags)]

    const orderBy = this.generateOrderBy(sort, direction, namespaces)

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
        ${config.filesPerPage}
      OFFSET
        ${(page - 1) * config.filesPerPage}`
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
  generateOrderBy (sort, direction, namespaces) {
    direction = ['asc', 'desc'].includes(direction) ? direction : null

    if (sort === 'namespaces' && namespaces.length) {
      const namespacesOrderBy = this.generateNamespacesOrderBy(
        namespaces, direction
      )

      if (!namespacesOrderBy.length) {
        return null
      }

      return `${namespacesOrderBy.join(',')}, hydrusrv_files.id DESC`
    }

    switch (sort) {
      case 'size':
        return `hydrusrv_files.size ${direction || 'DESC'}`
      case 'width':
        return `hydrusrv_files.width ${direction || 'DESC'}`
      case 'height':
        return `hydrusrv_files.height ${direction || 'DESC'}`
      case 'mime':
        return `hydrusrv_files.mime ${direction || 'ASC'}`
      case 'random':
        return 'hydrusrv_files.random ASC'
      default:
        return `hydrusrv_files.id ${direction || 'DESC'}`
    }
  },
  generateNamespacesOrderBy (namespaces, direction) {
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

    const namespacesOrderBy = []

    for (let namespace of namespaces) {
      namespace = namespace.split(' ').join('_')

      namespacesOrderBy.push(
        `CASE
          WHEN namespace_${namespace} IS NULL THEN 1
          ELSE 0
        END,
        namespace_${namespace} ${direction || 'ASC'}`
      )
    }

    return namespacesOrderBy
  }
}
