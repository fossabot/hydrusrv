const db = require('../database')
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
  getById (id) {
    const file = db.hydrus.prepare(
      `SELECT
        ${mappings.hashes}.master_hash_id AS id,
        ${mappings.filesInfo}.mime AS mimeType,
        ${mappings.filesInfo}.size,
        ${mappings.filesInfo}.width,
        ${mappings.filesInfo}.height,
        ${mappings.hashes}.hash
      FROM
        ${mappings.currentFiles}
      NATURAL JOIN
        ${mappings.repositoryHashIdMap}
      NATURAL JOIN
        ${mappings.hashes}
      NATURAL JOIN
        ${mappings.filesInfo}
      WHERE
        ${mappings.filesInfo}.master_hash_id = ?
      AND
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders});`
    ).get(id, hydrusConfig.supportedMimeTypes)

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
        ${mappings.hashes}.master_hash_id AS id,
        ${mappings.filesInfo}.mime AS mimeType,
        ${mappings.filesInfo}.size,
        ${mappings.filesInfo}.width,
        ${mappings.filesInfo}.height,
        ${mappings.hashes}.hash
      FROM
        ${mappings.currentFiles}
      NATURAL JOIN
        ${mappings.repositoryHashIdMap}
      NATURAL JOIN
        ${mappings.hashes}
      NATURAL JOIN
        ${mappings.filesInfo}
      WHERE
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
      GROUP BY
        ${mappings.hashes}.master_hash_id
      ORDER BY
        id ASC
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

    const files = db.hydrus.prepare(
      `SELECT
        ${mappings.hashes}.master_hash_id AS id,
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
        ${mappings.repositoryHashIdMap}
      NATURAL JOIN
        ${mappings.hashes}
      NATURAL JOIN
        ${mappings.filesInfo}
      WHERE
        ${mappings.tags}.tag IN (${',?'.repeat(tags.length).replace(',', '')})
      AND
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
      GROUP BY
        ${mappings.hashes}.master_hash_id
      HAVING
        count(DISTINCT ${mappings.currentMappings}.service_tag_id) = ?
      ORDER BY
        id ASC
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
        ${mappings.hashes}.master_hash_id AS id,
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
                ${mappings.repositoryHashIdMap}
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
        ${mappings.repositoryHashIdMap}
      NATURAL JOIN
        ${mappings.hashes}
      NATURAL JOIN
        ${mappings.filesInfo}
      WHERE
        ${mappings.repositoryHashIdMap}.master_hash_id IN
          (
            SELECT DISTINCT
              ${mappings.hashes}.master_hash_id AS id
            FROM
              ${mappings.currentMappings}
            NATURAL JOIN
              ${mappings.repositoryTagIdMap}
            NATURAL JOIN
              ${mappings.tags}
            NATURAL JOIN
              ${mappings.repositoryHashIdMap}
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
              id ASC
          )
      GROUP BY
        id
      ORDER BY
        ${mappings.tags}.tag ASC,
        id ASC
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

    const filesHavingTags = db.hydrus.prepare(
      `SELECT
        ${mappings.hashes}.master_hash_id AS id
      FROM
        ${mappings.currentMappings}
      NATURAL JOIN
        ${mappings.repositoryTagIdMap}
      NATURAL JOIN
        ${mappings.tags}
      NATURAL JOIN
        ${mappings.repositoryHashIdMap}
      NATURAL JOIN
        ${mappings.hashes}
      NATURAL JOIN
        ${mappings.filesInfo}
      WHERE
        ${mappings.tags}.tag IN (${',?'.repeat(tags.length).replace(',', '')})
      AND
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
      GROUP BY
        ${mappings.hashes}.master_hash_id
      HAVING
        count(DISTINCT ${mappings.currentMappings}.service_tag_id) = ?
      ORDER BY
        id ASC`
    ).all(tags, hydrusConfig.supportedMimeTypes, tags.length)

    const filesHavingNamespace = db.hydrus.prepare(
      `SELECT
        ${mappings.hashes}.master_hash_id AS id
      FROM
        ${mappings.currentMappings}
      NATURAL JOIN
        ${mappings.repositoryTagIdMap}
      NATURAL JOIN
        ${mappings.tags}
      NATURAL JOIN
        ${mappings.repositoryHashIdMap}
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
      ORDER BY
        id ASC`
    ).all(`${namespace}:%`, hydrusConfig.supportedMimeTypes)

    const fileIds = []

    for (const fileHavingNamespace of filesHavingNamespace) {
      if (
        filesHavingTags.findIndex(
          file => file.id === fileHavingNamespace.id
        ) > -1
      ) {
        fileIds.push(fileHavingNamespace.id)
      }
    }

    const files = db.hydrus.prepare(
      `SELECT
        ${mappings.hashes}.master_hash_id AS id,
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
                ${mappings.repositoryHashIdMap}
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
        ${mappings.repositoryHashIdMap}
      NATURAL JOIN
        ${mappings.hashes}
      NATURAL JOIN
        ${mappings.filesInfo}
      WHERE
        ${mappings.hashes}.master_hash_id IN (
          ${',?'.repeat(fileIds.length).replace(',', '')}
        )
      GROUP BY
        id
      ORDER BY
        ${mappings.tags}.tag ASC,
        id ASC
      LIMIT
        ${hydrusConfig.resultsPerPage}
      OFFSET
        ${(page - 1) * hydrusConfig.resultsPerPage};`
    ).all(
      `${namespace}:%`,
      hydrusConfig.supportedMimeTypes,
      fileIds
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
        ${mappings.repositoryHashIdMap}
      NATURAL JOIN
        ${mappings.filesInfo}
      WHERE
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders});`
    ).get(hydrusConfig.supportedMimeTypes)
  }
}
