const db = require('../database/hydrus')
const config = require('../config/app')
const hydrusConfig = require('../config/hydrus')
const mappings = require('../config/hydrus-mappings')

const generateFilePath = (type, hash) => {
  if (type === 'original') {
    return `${config.url}${config.mediaBase}/original/${hash.toString('hex')}`
  } else {
    return `${config.url}${config.mediaBase}/thumbnails/${hash.toString('hex')}`
  }
}

module.exports = {
  get (page) {
    const files = db.conn.prepare(
      `SELECT
        ${mappings.hashes}.master_hash_id AS fileId,
        ${mappings.hashes}.hash
      FROM
        ${mappings.currentFiles}
      INNER JOIN
        ${mappings.repositoryHashIdMapTags}
        ON
          ${mappings.repositoryHashIdMapTags}.service_hash_id =
          ${mappings.currentFiles}.service_hash_id
      INNER JOIN
        ${mappings.hashes}
        ON
          ${mappings.hashes}.master_hash_id =
          ${mappings.repositoryHashIdMapTags}.master_hash_id
      INNER JOIN
        ${mappings.filesInfo}
        ON
          ${mappings.filesInfo}.master_hash_id =
          ${mappings.hashes}.master_hash_id
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
      files.forEach(file => {
        file.thumbnailUrl = generateFilePath('thumbnail', file.hash)
        delete file.hash
      })
    }

    return files
  },
  getByTags (page, tags) {
    let tagPlaceholders = []
    tags.forEach(tag => {
      tagPlaceholders.push('?')
    })
    tagPlaceholders = tagPlaceholders.join(',')

    const files = db.conn.prepare(
      `SELECT
        ${mappings.hashes}.master_hash_id AS fileId,
        ${mappings.hashes}.hash
      FROM
        ${mappings.currentMappings}
      INNER JOIN
        ${mappings.repositoryTagIdMap}
        ON
          ${mappings.repositoryTagIdMap}.service_tag_id =
          ${mappings.currentMappings}.service_tag_id
      INNER JOIN
        ${mappings.tags}
        ON
          ${mappings.tags}.master_tag_id =
          ${mappings.repositoryTagIdMap}.master_tag_id
      INNER JOIN
        ${mappings.repositoryHashIdMapTags}
        ON
          ${mappings.repositoryHashIdMapTags}.service_hash_id =
          ${mappings.currentMappings}.service_hash_id
      INNER JOIN
        ${mappings.hashes}
        ON
          ${mappings.hashes}.master_hash_id =
          ${mappings.repositoryHashIdMapTags}.master_hash_id
      INNER JOIN
        ${mappings.filesInfo}
        ON
          ${mappings.filesInfo}.master_hash_id =
          ${mappings.hashes}.master_hash_id
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
      files.forEach(file => {
        file.thumbnailUrl = generateFilePath('thumbnail', file.hash)
        delete file.hash
      })
    }

    return files
  },
  getSortedByNamespace (page, namespace) {
    const files = db.conn.prepare(
      `SELECT
        ${mappings.hashes}.master_hash_id AS fileId,
        ${mappings.hashes}.hash
      FROM
        ${mappings.currentMappings}
      INNER JOIN
        ${mappings.repositoryTagIdMap}
        ON
          ${mappings.repositoryTagIdMap}.service_tag_id =
          ${mappings.currentMappings}.service_tag_id
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
              INNER JOIN
                ${mappings.repositoryTagIdMap}
                ON
                  ${mappings.repositoryTagIdMap}.service_tag_id =
                  ${mappings.currentMappings}.service_tag_id
              INNER JOIN
                ${mappings.tags}
                ON
                  ${mappings.tags}.master_tag_id =
                  ${mappings.repositoryTagIdMap}.master_tag_id
              INNER JOIN
                ${mappings.repositoryHashIdMapTags}
                ON
                  ${mappings.repositoryHashIdMapTags}.service_hash_id =
                  ${mappings.currentMappings}.service_hash_id
              INNER JOIN
                ${mappings.hashes}
                ON
                  ${mappings.hashes}.master_hash_id =
                  ${mappings.repositoryHashIdMapTags}.master_hash_id
              INNER JOIN
                ${mappings.filesInfo}
                ON
                  ${mappings.filesInfo}.master_hash_id =
                  ${mappings.hashes}.master_hash_id
              WHERE
                ${mappings.tags}.tag LIKE ?
              AND
                ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
              ORDER BY
                ${mappings.tags}.tag ASC
            )
      INNER JOIN
        ${mappings.repositoryHashIdMapTags}
        ON
          ${mappings.repositoryHashIdMapTags}.service_hash_id =
          ${mappings.currentMappings}.service_hash_id
      INNER JOIN
        ${mappings.hashes}
        ON
          ${mappings.hashes}.master_hash_id =
          ${mappings.repositoryHashIdMapTags}.master_hash_id
      INNER JOIN
        ${mappings.filesInfo}
        ON
          ${mappings.filesInfo}.master_hash_id =
          ${mappings.hashes}.master_hash_id
      WHERE
        ${mappings.repositoryHashIdMapTags}.master_hash_id IN
          (
            SELECT DISTINCT
              ${mappings.hashes}.master_hash_id AS fileId
            FROM
              ${mappings.currentMappings}
            INNER JOIN
              ${mappings.repositoryTagIdMap}
              ON
                ${mappings.repositoryTagIdMap}.service_tag_id =
                ${mappings.currentMappings}.service_tag_id
            INNER JOIN
              ${mappings.tags}
              ON
                ${mappings.tags}.master_tag_id =
                ${mappings.repositoryTagIdMap}.master_tag_id
            INNER JOIN
              ${mappings.repositoryHashIdMapTags}
              ON
                ${mappings.repositoryHashIdMapTags}.service_hash_id =
                ${mappings.currentMappings}.service_hash_id
            INNER JOIN
              ${mappings.hashes}
              ON
                ${mappings.hashes}.master_hash_id =
                ${mappings.repositoryHashIdMapTags}.master_hash_id
            INNER JOIN
              ${mappings.filesInfo}
              ON
                ${mappings.filesInfo}.master_hash_id =
                ${mappings.hashes}.master_hash_id
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
      files.forEach(file => {
        file.thumbnailUrl = generateFilePath('thumbnail', file.hash)
        delete file.hash
      })
    }

    return files
  },
  getByTagsSortedByNamespace (page, tags, namespace) {
    let tagPlaceholders = []
    tags.forEach(tag => {
      tagPlaceholders.push('?')
    })
    tagPlaceholders = tagPlaceholders.join(',')

    const files = db.conn.prepare(
      `SELECT
        ${mappings.hashes}.master_hash_id AS fileId,
        ${mappings.hashes}.hash
      FROM
        ${mappings.currentMappings}
      INNER JOIN
        ${mappings.repositoryTagIdMap}
        ON
          ${mappings.repositoryTagIdMap}.service_tag_id =
          ${mappings.currentMappings}.service_tag_id
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
              INNER JOIN
                ${mappings.repositoryTagIdMap}
                ON
                  ${mappings.repositoryTagIdMap}.service_tag_id =
                  ${mappings.currentMappings}.service_tag_id
              INNER JOIN
                ${mappings.tags}
                ON
                  ${mappings.tags}.master_tag_id =
                  ${mappings.repositoryTagIdMap}.master_tag_id
              INNER JOIN
                ${mappings.repositoryHashIdMapTags}
                ON
                  ${mappings.repositoryHashIdMapTags}.service_hash_id =
                  ${mappings.currentMappings}.service_hash_id
              INNER JOIN
                ${mappings.hashes}
                ON
                  ${mappings.hashes}.master_hash_id =
                  ${mappings.repositoryHashIdMapTags}.master_hash_id
              INNER JOIN
                ${mappings.filesInfo}
                ON
                  ${mappings.filesInfo}.master_hash_id =
                  ${mappings.hashes}.master_hash_id
              WHERE
                ${mappings.tags}.tag LIKE ?
              AND
                ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
              ORDER BY
                ${mappings.tags}.tag ASC
            )
      INNER JOIN
        ${mappings.repositoryHashIdMapTags}
        ON
          ${mappings.repositoryHashIdMapTags}.service_hash_id =
          ${mappings.currentMappings}.service_hash_id
      INNER JOIN
        ${mappings.hashes}
        ON
          ${mappings.hashes}.master_hash_id =
          ${mappings.repositoryHashIdMapTags}.master_hash_id
      INNER JOIN
        ${mappings.filesInfo}
        ON
          ${mappings.filesInfo}.master_hash_id =
          ${mappings.hashes}.master_hash_id
      WHERE
        ${mappings.repositoryHashIdMapTags}.master_hash_id IN
          (
            SELECT DISTINCT
              ${mappings.hashes}.master_hash_id AS fileId
            FROM
              ${mappings.currentMappings}
            INNER JOIN
              ${mappings.repositoryTagIdMap}
              ON
                ${mappings.repositoryTagIdMap}.service_tag_id =
                ${mappings.currentMappings}.service_tag_id
            INNER JOIN
              ${mappings.tags}
              ON
                ${mappings.tags}.master_tag_id =
                ${mappings.repositoryTagIdMap}.master_tag_id
            INNER JOIN
              ${mappings.repositoryHashIdMapTags}
              ON
                ${mappings.repositoryHashIdMapTags}.service_hash_id =
                ${mappings.currentMappings}.service_hash_id
            INNER JOIN
              ${mappings.hashes}
              ON
                ${mappings.hashes}.master_hash_id =
                ${mappings.repositoryHashIdMapTags}.master_hash_id
            INNER JOIN
              ${mappings.filesInfo}
              ON
                ${mappings.filesInfo}.master_hash_id =
                ${mappings.hashes}.master_hash_id
            WHERE
              ${mappings.tags}.tag IN (${tagPlaceholders})
            OR
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
      tags,
      `${namespace}:%`,
      hydrusConfig.supportedMimeTypes,
      tags.length + 1
    )

    if (files.length) {
      files.forEach(file => {
        file.thumbnailUrl = generateFilePath('thumbnail', file.hash)
        delete file.hash
      })
    }

    return files
  },
  getById (fileId) {
    const file = db.conn.prepare(
      `SELECT
        ${mappings.hashes}.master_hash_id AS fileId,
        ${mappings.filesInfo}.mime AS mimeType,
        ${mappings.filesInfo}.size,
        ${mappings.filesInfo}.width,
        ${mappings.filesInfo}.height,
        ${mappings.hashes}.hash
      FROM
        ${mappings.currentFiles}
      INNER JOIN
        ${mappings.repositoryHashIdMapTags}
        ON
          ${mappings.repositoryHashIdMapTags}.service_hash_id =
          ${mappings.currentFiles}.service_hash_id
      INNER JOIN
        ${mappings.hashes}
        ON
          ${mappings.hashes}.master_hash_id =
          ${mappings.repositoryHashIdMapTags}.master_hash_id
      INNER JOIN
        ${mappings.filesInfo}
        ON
          ${mappings.filesInfo}.master_hash_id =
          ${mappings.hashes}.master_hash_id
      WHERE
        ${mappings.filesInfo}.master_hash_id = ?
      AND
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})`
    ).get(fileId, hydrusConfig.supportedMimeTypes)

    if (file) {
      file.mimeType = hydrusConfig.availableMimeTypes[file.mimeType]
      file.mediaUrl = generateFilePath('original', file.hash)
      file.thumbnailUrl = generateFilePath('thumbnail', file.hash)
      delete file.hash
    }

    return file
  },
  getTotalCount () {
    return db.conn.prepare(
      `SELECT
        count(${mappings.currentFiles}.service_hash_id) AS count
      FROM
        ${mappings.currentFiles}
      INNER JOIN
        ${mappings.repositoryHashIdMapTags}
          ON
            ${mappings.repositoryHashIdMapTags}.service_hash_id =
            ${mappings.currentFiles}.service_hash_id
      INNER JOIN
        ${mappings.filesInfo}
          ON
            ${mappings.filesInfo}.master_hash_id =
            ${mappings.repositoryHashIdMapTags}.master_hash_id
      WHERE
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders});`
    ).get(hydrusConfig.supportedMimeTypes)
  }
}
