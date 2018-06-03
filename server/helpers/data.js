const db = require('../database')
const hydrusConfig = require('../config/hydrus')
const mappings = require('../config/hydrus-db-mappings')

module.exports = {
  sync () {
    if (db.app.updatingData) {
      return
    }

    console.time('update')
    db.app.updatingData = true

    db.hydrus.prepare('BEGIN').run()

    const namespaces = this.getNamespaces()
    const tags = this.getTags()
    const files = this.getFiles(namespaces)
    const mappings = this.getMappings()

    db.hydrus.prepare('COMMIT').run()

    this.createTempNamespacesTable()
    this.createTempTagsTable()
    this.createTempFilesTable(namespaces)
    this.createTempMappingsTable()

    this.fillTempNamespacesTable(namespaces)
    this.fillTempTagsTable(tags)
    this.fillTempFilesTable(files, namespaces)
    this.fillTempMappingsTable(mappings)

    this.replaceCurrentTempTables()

    db.app.updatingData = false
    console.timeEnd('update')
  },
  replaceCurrentTempTables () {
    db.app.prepare('DROP TABLE IF EXISTS hydrusrv_namespaces').run()
    db.app.prepare('DROP TABLE IF EXISTS hydrusrv_mappings').run()
    db.app.prepare('DROP TABLE IF EXISTS hydrusrv_tags').run()
    db.app.prepare('DROP TABLE IF EXISTS hydrusrv_files').run()

    db.app.prepare(
      'ALTER TABLE hydrusrv_namespaces_new RENAME TO hydrusrv_namespaces'
    ).run()

    db.app.prepare(
      'ALTER TABLE hydrusrv_tags_new RENAME TO hydrusrv_tags'
    ).run()

    db.app.prepare(
      'ALTER TABLE hydrusrv_files_new RENAME TO hydrusrv_files'
    ).run()

    db.app.prepare(
      'ALTER TABLE hydrusrv_mappings_new RENAME TO hydrusrv_mappings'
    ).run()
  },
  createTempNamespacesTable () {
    db.app.prepare(
      `CREATE TEMP TABLE hydrusrv_namespaces_new (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
        name TEXT NOT NULL UNIQUE
      )`
    ).run()
  },
  fillTempNamespacesTable (namespaces) {
    for (const namespace of namespaces) {
      db.app.prepare(
        'INSERT INTO hydrusrv_namespaces_new (name) VALUES (?)'
      ).run(namespace)
    }
  },
  createTempTagsTable () {
    db.app.prepare(
      `CREATE TEMP TABLE hydrusrv_tags_new (
        id INTEGER NOT NULL PRIMARY KEY UNIQUE,
        name TEXT NOT NULL UNIQUE
      )`
    ).run()
  },
  fillTempTagsTable (tags) {
    for (const tag of tags) {
      db.app.prepare(
        'INSERT INTO hydrusrv_tags_new (id, name) VALUES (?, ?)'
      ).run(tag.id, tag.name)
    }
  },
  createTempFilesTable (namespaces) {
    const namespaceColumns = []

    for (const namespace of namespaces) {
      namespaceColumns.push(
        `namespace_${namespace.split(' ').join('_')} TEXT`
      )
    }

    db.app.prepare(
      `CREATE TEMP TABLE hydrusrv_files_new (
        id INTEGER NOT NULL PRIMARY KEY UNIQUE,
        mime INTEGER NOT NULL,
        size INTEGER NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        hash BLOB_BYTES UNIQUE NOT NULL
        ${(namespaceColumns.length) ? ',' + namespaceColumns.join(',') : ''}
      )`
    ).run()
  },
  fillTempFilesTable (files, namespaces) {
    const namespaceColumns = []

    for (const namespace of namespaces) {
      namespaceColumns.push(
        `namespace_${namespace.split(' ').join('_')}`
      )
    }

    for (const file of files) {
      const namespaceParameters = []

      for (const namespace of namespaces) {
        namespaceParameters.push(
          file[`namespace_${namespace.split(' ').join('_')}`]
        )
      }

      db.app.prepare(
        `INSERT INTO hydrusrv_files_new (
          id,
          mime,
          size,
          width,
          height,
          hash
          ${(namespaceColumns.length) ? ',' + namespaceColumns.join(',') : ''}
        ) VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
          ${',?'.repeat(namespaceColumns.length)}
        )`
      ).run(
        file.id,
        file.mimeType,
        file.size,
        file.width,
        file.height,
        file.hash,
        ...namespaceParameters
      )
    }
  },
  createTempMappingsTable () {
    db.app.prepare(
      `CREATE TEMP TABLE hydrusrv_mappings_new (
        file_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        FOREIGN KEY(file_id) REFERENCES hydrusrv_files_new(id)
          ON UPDATE CASCADE
          ON DELETE CASCADE,
        FOREIGN KEY(tag_id) REFERENCES hydrusrv_tags_new(id)
          ON UPDATE CASCADE
          ON DELETE CASCADE
      )`
    ).run()
  },
  fillTempMappingsTable (mappings) {
    for (const mapping of mappings) {
      db.app.prepare(
        'INSERT INTO hydrusrv_mappings_new (file_id, tag_id) VALUES (?, ?)'
      ).run(mapping.fileId, mapping.tagId)
    }
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
        name`
    ).pluck().all(`%:%`, hydrusConfig.supportedMimeTypes)
  },
  getTags () {
    return db.hydrus.prepare(
      `SELECT DISTINCT
        ${mappings.currentMappings}.service_tag_id AS id,
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
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})`
    ).all(hydrusConfig.supportedMimeTypes)
  },
  getFiles (namespaces) {
    const files = db.hydrus.prepare(
      `SELECT
        ${mappings.currentFiles}.service_hash_id AS id,
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
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})`
    ).all(hydrusConfig.supportedMimeTypes)

    for (const namespace of namespaces) {
      for (const file of files) {
        const tags = db.hydrus.prepare(
          `SELECT
            ${mappings.tags}.tag
          FROM
            ${mappings.currentMappings}
          NATURAL JOIN
            ${mappings.repositoryTagIdMap}
          NATURAL JOIN
            ${mappings.tags}
          NATURAL JOIN
            ${mappings.repositoryHashIdMap}
          WHERE
            ${mappings.tags}.tag LIKE ?
          AND
            ${mappings.repositoryHashIdMap}.service_hash_id = ?
          ORDER BY
            ${mappings.tags}.tag
          LIMIT
            1`
        ).all(`${namespace}:%`, file.id)

        file[`namespace_${namespace.split(' ').join('_')}`] = tags.length
          ? tags[0].tag.replace(`${namespace.split(' ').join('_')}:`, '')
          : null
      }
    }

    return files
  },
  getMappings () {
    return db.hydrus.prepare(
      `SELECT
        ${mappings.currentMappings}.service_hash_id AS fileId,
        ${mappings.currentMappings}.service_tag_id AS tagId
      FROM
        ${mappings.currentMappings}
      NATURAL JOIN
        ${mappings.repositoryHashIdMap}
      NATURAL JOIN
        ${mappings.filesInfo}
      WHERE
        ${mappings.filesInfo}.mime IN (${mappings.mimePlaceholders})`
    ).all(hydrusConfig.supportedMimeTypes)
  }
}
