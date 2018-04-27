const db = require('../database/hydrus')
const hydrusConfig = require('../config/hydrus')
const mappings = require('../config/hydrus-mappings')

module.exports = {
  get (page) {
    return db.conn.prepare(
      `SELECT DISTINCT
        ${mappings.tags}.tag AS name
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
        ${mappings.repositoryHashIdMapFiles}
          ON
            ${mappings.repositoryHashIdMapFiles}.service_hash_id =
            ${mappings.currentMappings}.service_hash_id
      INNER JOIN
        ${mappings.filesInfo}
          ON
            ${mappings.filesInfo}.master_hash_id =
            ${mappings.repositoryHashIdMapFiles}.master_hash_id
      WHERE
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
      ORDER BY
        ${mappings.tags}.tag ASC
      LIMIT
        ${hydrusConfig.resultsPerPage}
      OFFSET
        ${(page - 1) * hydrusConfig.resultsPerPage};`
    ).all(hydrusConfig.supportedMimeTypes)
  },
  getOfFile (fileId) {
    return db.conn.prepare(
      `SELECT
        ${mappings.tags}.tag AS name
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
        ${mappings.repositoryHashIdMapFiles}
          ON
            ${mappings.repositoryHashIdMapFiles}.service_hash_id =
            ${mappings.currentMappings}.service_hash_id
      INNER JOIN
        ${mappings.filesInfo}
          ON
            ${mappings.filesInfo}.master_hash_id =
            ${mappings.repositoryHashIdMapFiles}.master_hash_id
      WHERE
        ${mappings.filesInfo}.master_hash_id = ?
      AND
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
      ORDER BY
        ${mappings.tags}.tag ASC;`
    ).all(fileId, hydrusConfig.supportedMimeTypes)
  },
  autocomplete (partialTag) {
    return db.conn.prepare(
      `SELECT DISTINCT
        ${mappings.tags}.tag AS name
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
        ${mappings.repositoryHashIdMapFiles}
          ON
            ${mappings.repositoryHashIdMapFiles}.service_hash_id =
            ${mappings.currentMappings}.service_hash_id
      INNER JOIN
        ${mappings.filesInfo}
          ON
            ${mappings.filesInfo}.master_hash_id =
            ${mappings.repositoryHashIdMapFiles}.master_hash_id
      WHERE
        ${mappings.tags}.tag LIKE ?
      AND
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
      ORDER BY
        ${mappings.tags}.tag ASC
      LIMIT
        10;`
    ).all(`%${partialTag}%`, hydrusConfig.supportedMimeTypes)
  },
  getNamespaces () {
    return db.conn.prepare(
      `SELECT DISTINCT
        SUBSTR(
          ${mappings.tags}.tag,
          INSTR(${mappings.tags}.tag, ':'),
          -INSTR(${mappings.tags}.tag, ':')
        ) AS name
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
        ${mappings.repositoryHashIdMapFiles}
          ON
            ${mappings.repositoryHashIdMapFiles}.service_hash_id =
            ${mappings.currentMappings}.service_hash_id
      INNER JOIN
        ${mappings.filesInfo}
          ON
            ${mappings.filesInfo}.master_hash_id =
            ${mappings.repositoryHashIdMapFiles}.master_hash_id
      WHERE
        ${mappings.tags}.tag LIKE ?
      AND
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
      ORDER BY
        ${mappings.tags}.tag ASC;`
    ).all(`%:%`, hydrusConfig.supportedMimeTypes)
  },
  getTotalCount () {
    return db.conn.prepare(
      `SELECT
        COUNT(DISTINCT ${mappings.tags}.tag) as count
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
        ${mappings.repositoryHashIdMapFiles}
          ON
            ${mappings.repositoryHashIdMapFiles}.service_hash_id =
            ${mappings.currentMappings}.service_hash_id
      INNER JOIN
        ${mappings.filesInfo}
          ON
            ${mappings.filesInfo}.master_hash_id =
            ${mappings.repositoryHashIdMapFiles}.master_hash_id
      WHERE
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
      ORDER BY
        ${mappings.tags}.tag ASC`
    ).get(hydrusConfig.supportedMimeTypes)
  }
}
