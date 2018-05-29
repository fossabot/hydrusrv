const db = require('../database')
const hydrusConfig = require('../config/hydrus')
const mappings = require('../config/hydrus-db-mappings')

module.exports = {
  get (page) {
    return db.hydrus.prepare(
      `SELECT DISTINCT
        ${mappings.tags}.tag AS name
      FROM
        ${mappings.currentMappings}
      NATURAL JOIN
        ${mappings.repositoryTagIdMap}
      NATURAL JOIN
        ${mappings.tags}
      NATURAL JOIN
        ${mappings.repositoryHashIdMap}
      NATURAL JOIN
        ${mappings.filesInfo}
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
    return db.hydrus.prepare(
      `SELECT
        ${mappings.tags}.tag AS name
      FROM
        ${mappings.currentMappings}
      NATURAL JOIN
        ${mappings.repositoryTagIdMap}
      NATURAL JOIN
        ${mappings.tags}
      NATURAL JOIN
        ${mappings.repositoryHashIdMap}
      NATURAL JOIN
        ${mappings.filesInfo}
      WHERE
        ${mappings.filesInfo}.master_hash_id = ?
      AND
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
      ORDER BY
        ${mappings.tags}.tag ASC;`
    ).all(fileId, hydrusConfig.supportedMimeTypes)
  },
  autocomplete (partialTag) {
    return db.hydrus.prepare(
      `SELECT DISTINCT
        ${mappings.tags}.tag AS name
      FROM
        ${mappings.currentMappings}
      NATURAL JOIN
        ${mappings.repositoryTagIdMap}
      NATURAL JOIN
        ${mappings.tags}
      NATURAL JOIN
        ${mappings.repositoryHashIdMap}
      NATURAL JOIN
        ${mappings.filesInfo}
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
    return db.hydrus.prepare(
      `SELECT DISTINCT
        SUBSTR(
          ${mappings.tags}.tag,
          INSTR(${mappings.tags}.tag, ':'),
          -INSTR(${mappings.tags}.tag, ':')
        ) AS name
      FROM
        ${mappings.currentMappings}
      NATURAL JOIN
        ${mappings.repositoryTagIdMap}
      NATURAL JOIN
        ${mappings.tags}
      NATURAL JOIN
        ${mappings.repositoryHashIdMap}
      NATURAL JOIN
        ${mappings.filesInfo}
      WHERE
        ${mappings.tags}.tag LIKE ?
      AND
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
      ORDER BY
        ${mappings.tags}.tag ASC;`
    ).all(`%:%`, hydrusConfig.supportedMimeTypes)
  },
  getTotalCount () {
    return db.hydrus.prepare(
      `SELECT
        COUNT(DISTINCT ${mappings.tags}.tag) as count
      FROM
        ${mappings.currentMappings}
      NATURAL JOIN
        ${mappings.repositoryTagIdMap}
      NATURAL JOIN
        ${mappings.tags}
      NATURAL JOIN
        ${mappings.repositoryHashIdMap}
      NATURAL JOIN
        ${mappings.filesInfo}
      WHERE
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})
      ORDER BY
        ${mappings.tags}.tag ASC;`
    ).get(hydrusConfig.supportedMimeTypes)
  }
}
