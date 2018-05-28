const db = require('../database/database')
const config = require('../config/app')
const hydrusConfig = require('../config/hydrus')
const mappings = require('../config/hydrus-db-mappings')

const generateFilePath = (type, hash) => {
  if (type === 'thumbnail') {
    return `${config.url}${config.mediaBase}/thumbnails/${hash.toString('hex')}`
  }

  return `${config.url}${config.mediaBase}/original/${hash.toString('hex')}`
}

module.exports = {
  getById (fileId) {
    const file = db.hydrus.prepare(
      `SELECT
        ${mappings.hashes}.master_hash_id AS fileId,
        ${mappings.filesInfo}.mime AS mimeType,
        ${mappings.filesInfo}.size,
        ${mappings.filesInfo}.width,
        ${mappings.filesInfo}.height,
        ${mappings.hashes}.hash
      FROM
        ${mappings.currentFiles}
      NATURAL JOIN
        ${mappings.repositoryHashIdMapTags}
      NATURAL JOIN
        ${mappings.hashes}
      NATURAL JOIN
        ${mappings.filesInfo}
      WHERE
        ${mappings.filesInfo}.master_hash_id = ?
      AND
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders});`
    ).get(fileId, hydrusConfig.supportedMimeTypes)

    if (file) {
      file.mimeType = hydrusConfig.availableMimeTypes[file.mimeType]
      file.mediaUrl = generateFilePath('original', file.hash)
      file.thumbnailUrl = generateFilePath('thumbnail', file.hash)
      delete file.hash
    }

    return file
  },
  get (page) {
    const files = db.hydrus.prepare(
      `SELECT
        ${mappings.hashes}.master_hash_id AS fileId,
        ${mappings.filesInfo}.mime AS mimeType,
        ${mappings.filesInfo}.size,
        ${mappings.filesInfo}.width,
        ${mappings.filesInfo}.height,
        ${mappings.hashes}.hash
      FROM
        ${mappings.currentFiles}
      NATURAL JOIN
        ${mappings.repositoryHashIdMapTags}
      NATURAL JOIN
        ${mappings.hashes}
      NATURAL JOIN
        ${mappings.filesInfo}
      WHERE
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
      GROUP BY
        ${mappings.hashes}.master_hash_id
      ORDER BY
        fileId ASC
      LIMIT
        ${hydrusConfig.resultsPerPage}
      OFFSET
        ${(page - 1) * hydrusConfig.resultsPerPage};`
    ).all(hydrusConfig.supportedMimeTypes)

    if (files.length) {
      for (const file of files) {
        file.mimeType = hydrusConfig.availableMimeTypes[file.mimeType]
        file.mediaUrl = generateFilePath('original', file.hash)
        file.thumbnailUrl = generateFilePath('thumbnail', file.hash)
        delete file.hash
      }
    }

    return files
  },
  getByTags (page, tags) {
    tags = [...new Set(tags)]

    let tagPlaceholders = []

    for (let i = 0; i < tags.length; i++) {
      tagPlaceholders.push('?')
    }

    tagPlaceholders = tagPlaceholders.join(',')

    const files = db.hydrus.prepare(
      `SELECT
        ${mappings.hashes}.master_hash_id AS fileId,
        ${mappings.filesInfo}.mime AS mimeType,
        ${mappings.filesInfo}.size,
        ${mappings.filesInfo}.width,
        ${mappings.filesInfo}.height,
        ${mappings.hashes}.hash
      FROM
        ${mappings.currentMappings}
      NATURAL JOIN
        ${mappings.repositoryTagIdMap}
      NATURAL JOIN
        ${mappings.tags}
      NATURAL JOIN
        ${mappings.repositoryHashIdMapTags}
      NATURAL JOIN
        ${mappings.hashes}
      NATURAL JOIN
        ${mappings.filesInfo}
      WHERE
        ${mappings.tags}.tag IN (${tagPlaceholders})
      AND
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
      GROUP BY
        ${mappings.hashes}.master_hash_id
      HAVING
        count(DISTINCT ${mappings.currentMappings}.service_tag_id) = ?
      ORDER BY
        fileId ASC
      LIMIT
        ${hydrusConfig.resultsPerPage}
      OFFSET
        ${(page - 1) * hydrusConfig.resultsPerPage};`
    ).all(tags, hydrusConfig.supportedMimeTypes, tags.length)

    if (files.length) {
      for (const file of files) {
        file.mimeType = hydrusConfig.availableMimeTypes[file.mimeType]
        file.mediaUrl = generateFilePath('original', file.hash)
        file.thumbnailUrl = generateFilePath('thumbnail', file.hash)
        delete file.hash
      }
    }

    return files
  },
  getSortedByNamespace (page, namespace) {
    const files = db.hydrus.prepare(
      `SELECT
        ${mappings.hashes}.master_hash_id AS fileId,
        ${mappings.filesInfo}.mime AS mimeType,
        ${mappings.filesInfo}.size,
        ${mappings.filesInfo}.width,
        ${mappings.filesInfo}.height,
        ${mappings.hashes}.hash
      FROM
        ${mappings.currentMappings}
      NATURAL JOIN
        ${mappings.repositoryTagIdMap}
      INNER JOIN
        ${mappings.tags}
        ON
          ${mappings.tags}.master_tag_id =
          ${mappings.repositoryTagIdMap}.master_tag_id
        AND
          ${mappings.tags}.master_tag_id IN
            (
              SELECT DISTINCT
                ${mappings.tags}.master_tag_id
              FROM
                ${mappings.currentMappings}
              NATURAL JOIN
                ${mappings.repositoryTagIdMap}
              NATURAL JOIN
                ${mappings.tags}
              NATURAL JOIN
                ${mappings.repositoryHashIdMapTags}
              NATURAL JOIN
                ${mappings.hashes}
              NATURAL JOIN
                ${mappings.filesInfo}
              WHERE
                ${mappings.tags}.tag LIKE ?
              AND
                ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
              ORDER BY
                ${mappings.tags}.tag ASC
            )
      NATURAL JOIN
        ${mappings.repositoryHashIdMapTags}
      NATURAL JOIN
        ${mappings.hashes}
      NATURAL JOIN
        ${mappings.filesInfo}
      WHERE
        ${mappings.repositoryHashIdMapTags}.master_hash_id IN
          (
            SELECT DISTINCT
              ${mappings.hashes}.master_hash_id AS fileId
            FROM
              ${mappings.currentMappings}
            NATURAL JOIN
              ${mappings.repositoryTagIdMap}
            NATURAL JOIN
              ${mappings.tags}
            NATURAL JOIN
              ${mappings.repositoryHashIdMapTags}
            NATURAL JOIN
              ${mappings.hashes}
            NATURAL JOIN
              ${mappings.filesInfo}
            WHERE
              ${mappings.tags}.tag LIKE ?
            AND
              ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
            GROUP BY
              ${mappings.hashes}.master_hash_id
            HAVING
              count(DISTINCT ${mappings.currentMappings}.service_tag_id) = ?
            ORDER BY
              fileId ASC
          )
      GROUP BY
        fileId
      ORDER BY
        ${mappings.tags}.tag ASC,
        fileId ASC
      LIMIT
        ${hydrusConfig.resultsPerPage}
      OFFSET
        ${(page - 1) * hydrusConfig.resultsPerPage};`
    ).all(
      `${namespace}:%`,
      hydrusConfig.supportedMimeTypes,
      `${namespace}:%`,
      hydrusConfig.supportedMimeTypes,
      1
    )

    if (files.length) {
      for (const file of files) {
        file.mimeType = hydrusConfig.availableMimeTypes[file.mimeType]
        file.mediaUrl = generateFilePath('original', file.hash)
        file.thumbnailUrl = generateFilePath('thumbnail', file.hash)
        delete file.hash
      }
    }

    return files
  },
  getByTagsSortedByNamespace (page, tags, namespace) {
    tags = [...new Set(tags)]

    const namespacedTags = db.hydrus.prepare(
      `SELECT DISTINCT
        ${mappings.tags}.tag,
        ${mappings.tags}.master_tag_id
      FROM
        ${mappings.currentMappings}
      NATURAL JOIN
        ${mappings.repositoryTagIdMap}
      NATURAL JOIN
        ${mappings.tags}
      NATURAL JOIN
        ${mappings.repositoryHashIdMapTags}
      NATURAL JOIN
        ${mappings.hashes}
      NATURAL JOIN
        ${mappings.filesInfo}
      WHERE
        ${mappings.tags}.tag LIKE ?
      AND
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
      ORDER BY
        ${mappings.tags}.tag ASC`
    ).all(
      `${namespace}:%`,
      hydrusConfig.supportedMimeTypes
    )

    const namespacedTagNames = []
    const namespacedTagIds = []

    let tagsContainNamespace = false

    if (tags.findIndex(tag => tag.startsWith(`${namespace}:`)) > -1) {
      tagsContainNamespace = true

      for (let i = 0; i < namespacedTags.length; i++) {
        if (tags.findIndex(tag => tag === namespacedTags[i].tag) > -1) {
          namespacedTagNames.push(namespacedTags[i].tag)
          namespacedTagIds.push(namespacedTags[i].master_tag_id)
        }
      }
    } else {
      for (let i = 0; i < namespacedTags.length; i++) {
        namespacedTagNames.push(namespacedTags[i].tag)
        namespacedTagIds.push(namespacedTags[i].master_tag_id)
      }
    }

    const namespacedTagIdPlaceholders = []

    for (let i = 0; i < namespacedTagIds.length; i++) {
      namespacedTagIdPlaceholders.push('?')
    }

    const combinedTags = [...new Set([...tags, ...namespacedTagNames])]

    const whereTagLikes = []

    for (let i = 0; i < combinedTags.length; i++) {
      whereTagLikes.push(
        `${(i === 0) ? 'WHERE' : 'OR'} ${mappings.tags}.tag LIKE ?`
      )
    }

    const files = db.hydrus.prepare(
      `SELECT
        ${mappings.hashes}.master_hash_id AS fileId,
        ${mappings.filesInfo}.mime AS mimeType,
        ${mappings.filesInfo}.size,
        ${mappings.filesInfo}.width,
        ${mappings.filesInfo}.height,
        ${mappings.hashes}.hash
      FROM
        ${mappings.currentMappings}
      NATURAL JOIN
        ${mappings.repositoryTagIdMap}
      INNER JOIN
        ${mappings.tags}
        ON
          ${mappings.tags}.master_tag_id =
          ${mappings.repositoryTagIdMap}.master_tag_id
        AND
          ${mappings.tags}.master_tag_id IN (${namespacedTagIdPlaceholders})
      NATURAL JOIN
        ${mappings.repositoryHashIdMapTags}
      NATURAL JOIN
        ${mappings.hashes}
      NATURAL JOIN
        ${mappings.filesInfo}
      WHERE
        ${mappings.repositoryHashIdMapTags}.master_hash_id IN
          (
            SELECT DISTINCT
              ${mappings.hashes}.master_hash_id AS fileId
            FROM
              ${mappings.currentMappings}
            NATURAL JOIN
              ${mappings.repositoryTagIdMap}
            NATURAL JOIN
              ${mappings.tags}
            NATURAL JOIN
              ${mappings.repositoryHashIdMapTags}
            NATURAL JOIN
              ${mappings.hashes}
            NATURAL JOIN
              ${mappings.filesInfo}
            ${whereTagLikes.join(' ')}
            AND
              ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
            GROUP BY
              ${mappings.hashes}.master_hash_id
            HAVING
              count(DISTINCT ${mappings.currentMappings}.service_tag_id) = ?
            ORDER BY
              fileId ASC
          )
      GROUP BY
        fileId
      ORDER BY
        ${mappings.tags}.tag ASC,
        fileId ASC
      LIMIT
        ${hydrusConfig.resultsPerPage}
      OFFSET
        ${(page - 1) * hydrusConfig.resultsPerPage};`
    ).all(
      namespacedTagIds,
      combinedTags,
      hydrusConfig.supportedMimeTypes,
      (tagsContainNamespace) ? combinedTags.length : tags.length + 1
    )

    if (files.length) {
      for (const file of files) {
        file.mimeType = hydrusConfig.availableMimeTypes[file.mimeType]
        file.mediaUrl = generateFilePath('original', file.hash)
        file.thumbnailUrl = generateFilePath('thumbnail', file.hash)
        delete file.hash
      }
    }

    return files
  },
  getTotalCount () {
    return db.hydrus.prepare(
      `SELECT
        count(${mappings.currentFiles}.service_hash_id) AS count
      FROM
        ${mappings.currentFiles}
      NATURAL JOIN
        ${mappings.repositoryHashIdMapTags}
      NATURAL JOIN
        ${mappings.filesInfo}
      WHERE
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders});`
    ).get(hydrusConfig.supportedMimeTypes)
  }
}
