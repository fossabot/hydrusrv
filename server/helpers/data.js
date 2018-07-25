const config = require('../config/app')
const db = require('../database')
const hydrusConfig = require('../config/hydrus')
const hydrusTables = require('../config/hydrus-db-tables')

module.exports = {
  sync () {
    if (db.updatingData) {
      return
    }

    db.updatingData = true

    let updateSuccessful = true

    let namespaces, tags, files, mappings

    try {
      namespaces = this.getNamespaces()
      tags = this.getTags()
      files = this.getFiles(namespaces)
      mappings = this.getMappings(files.map(file => file.id))

      this.createTempNamespacesTable()
      this.createTempTagsTable()
      this.createTempFilesTable(namespaces)
      this.createTempMappingsTable()
    } catch (err) {
      updateSuccessful = false

      console.warn(
        'hydrus server has no repositories set up yet or there has been an ' +
          'error (this can for example happen if hydrus server was in the ' +
          'process of writing while hydrusrv tried to read data). It will ' +
          'try updating again after the period set via ' +
          `\`DATA_UPDATE_INTERVAL\` (${config.dataUpdateInterval} seconds).`
      )
    }

    if (updateSuccessful) {
      this.fillTempNamespacesTable(namespaces)
      this.fillTempTagsTable(tags)
      this.fillTempFilesTable(files, namespaces)
      this.fillTempMappingsTable(mappings)

      this.replaceCurrentTempTables()
    }

    db.updatingData = false
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
        name TEXT NOT NULL UNIQUE,
        files INTEGER NOT NULL
      )`
    ).run()
  },
  fillTempTagsTable (tags) {
    for (const tag of tags) {
      db.app.prepare(
        'INSERT INTO hydrusrv_tags_new (id, name, files) VALUES (?, ?, ?)'
      ).run(tag.id, tag.name, tag.files)
    }
  },
  createTempFilesTable (namespaces) {
    const namespaceColumns = []

    if (Array.isArray(namespaces)) {
      for (const namespace of namespaces) {
        namespaceColumns.push(
          `namespace_${namespace.split(' ').join('_')} TEXT`
        )
      }
    }

    db.app.prepare(
      `CREATE TEMP TABLE hydrusrv_files_new (
        id INTEGER NOT NULL PRIMARY KEY UNIQUE,
        mime INTEGER NOT NULL,
        size INTEGER NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        hash BLOB_BYTES UNIQUE NOT NULL,
        random TEXT NOT NULL
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
          hash,
          random
          ${(namespaceColumns.length) ? ',' + namespaceColumns.join(',') : ''}
        ) VALUES (
          ?,
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
        (Math.floor(Math.random() * 10000) + 10000).toString().substring(1),
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
          ${hydrusTables.tags}.tag,
          INSTR(${hydrusTables.tags}.tag, ':'),
          -INSTR(${hydrusTables.tags}.tag, ':')
        ) AS name
      FROM
        ${hydrusTables.currentMappings}
      NATURAL JOIN
        ${hydrusTables.repositoryTagIdMap}
      NATURAL JOIN
        ${hydrusTables.tags}
      NATURAL JOIN
        ${hydrusTables.repositoryHashIdMapTags}
      NATURAL JOIN
        ${hydrusTables.filesInfo}
      WHERE
        ${hydrusTables.tags}.tag LIKE '%:%'
      AND
        ${hydrusTables.filesInfo}.mime IN (${hydrusConfig.supportedMimeTypes})
      ORDER BY
        name`
    ).pluck().all()
  },
  getTags () {
    return db.hydrus.prepare(
      `SELECT
        ${hydrusTables.currentMappings}.service_tag_id AS id,
        ${hydrusTables.tags}.tag AS name,
        COUNT(*) as files
      FROM
        ${hydrusTables.currentMappings}
      NATURAL JOIN
        ${hydrusTables.repositoryTagIdMap}
      NATURAL JOIN
        ${hydrusTables.tags}
      NATURAL JOIN
        ${hydrusTables.repositoryHashIdMapTags}
      NATURAL JOIN
        ${hydrusTables.filesInfo}
      WHERE
        ${hydrusTables.filesInfo}.mime IN (${hydrusConfig.supportedMimeTypes})
      GROUP BY
        ${hydrusTables.tags}.tag`
    ).all()
  },
  getFiles (namespaces) {
    const filesWithTags = db.hydrus.prepare(
      `SELECT
        ${hydrusTables.currentFiles}.service_hash_id AS id,
        ${hydrusTables.hashes}.master_hash_id AS masterHashId,
        ${hydrusTables.hashes}.hash,
        ${hydrusTables.filesInfo}.mime AS mimeType,
        ${hydrusTables.filesInfo}.size,
        ${hydrusTables.filesInfo}.width,
        ${hydrusTables.filesInfo}.height
      FROM
        ${hydrusTables.hashes}
      NATURAL JOIN
        ${hydrusTables.filesInfo}
      NATURAL JOIN
        ${hydrusTables.repositoryHashIdMapTags}
      NATURAL JOIN
        ${hydrusTables.currentFiles}
      WHERE
        ${hydrusTables.filesInfo}.mime IN (${hydrusConfig.supportedMimeTypes})`
    ).all()

    const confirmedServiceHashIds = filesWithTags.map(row => row.id)
    const confirmedMasterHashIds = filesWithTags.map(row => row.masterHashId)

    const filesWithoutTags = db.hydrus.prepare(
      `SELECT
        ${hydrusTables.currentFiles}.service_hash_id AS id,
        ${hydrusTables.hashes}.master_hash_id AS masterHashId,
        ${hydrusTables.hashes}.hash,
        ${hydrusTables.filesInfo}.mime AS mimeType,
        ${hydrusTables.filesInfo}.size,
        ${hydrusTables.filesInfo}.width,
        ${hydrusTables.filesInfo}.height
      FROM
        ${hydrusTables.hashes}
      NATURAL JOIN
        ${hydrusTables.filesInfo}
      NATURAL JOIN
        ${hydrusTables.repositoryHashIdMapFiles}
      NATURAL JOIN
        ${hydrusTables.currentFiles}
      WHERE
        ${hydrusTables.hashes}.master_hash_id NOT IN (
          ${confirmedMasterHashIds}
        )
      AND
        ${hydrusTables.currentFiles}.service_hash_id NOT IN (
          ${confirmedServiceHashIds}
        )
      AND
        ${hydrusTables.filesInfo}.mime IN (${hydrusConfig.supportedMimeTypes})`
    ).all()

    const files = filesWithTags.concat(filesWithoutTags)

    for (const namespace of namespaces) {
      for (const file of files) {
        const tags = db.hydrus.prepare(
          `SELECT
            ${hydrusTables.tags}.tag
          FROM
            ${hydrusTables.currentMappings}
          NATURAL JOIN
            ${hydrusTables.repositoryTagIdMap}
          NATURAL JOIN
            ${hydrusTables.tags}
          NATURAL JOIN
            ${hydrusTables.repositoryHashIdMapTags}
          WHERE
            ${hydrusTables.tags}.tag LIKE '${namespace}:%'
          AND
            ${hydrusTables.repositoryHashIdMapTags}.service_hash_id = ${file.id}
          ORDER BY
            ${hydrusTables.tags}.tag
          LIMIT
            1`
        ).all()

        file[`namespace_${namespace.split(' ').join('_')}`] = tags.length
          ? tags[0].tag.replace(`${namespace.split(' ').join('_')}:`, '')
          : null
      }
    }

    return files
  },
  getMappings (fileIds) {
    return db.hydrus.prepare(
      `SELECT
        ${hydrusTables.currentMappings}.service_hash_id AS fileId,
        ${hydrusTables.currentMappings}.service_tag_id AS tagId
      FROM
        ${hydrusTables.currentMappings}
      NATURAL JOIN
        ${hydrusTables.repositoryHashIdMapTags}
      INNER JOIN
        ${hydrusTables.currentFiles}
        ON ${hydrusTables.currentFiles}.service_hash_id =
          ${hydrusTables.repositoryHashIdMapTags}.service_hash_id
      WHERE
        ${hydrusTables.currentMappings}.service_hash_id IN (${fileIds})`
    ).all()
  }
}
