const hydrusConfig = require('./hydrus')

let mimePlaceholders = []

hydrusConfig.supportedMimeTypes.forEach(supportedMimeType => {
  mimePlaceholders.push('?')
})

mimePlaceholders = mimePlaceholders.join(',')

module.exports = {
  mimePlaceholders,
  tags: 'master_db.tags',
  hashes: 'master_db.hashes',
  filesInfo: 'main.files_info',
  currentMappings:
    `mappings_db.current_mappings_${hydrusConfig.tagRepository}`,
  repositoryTagIdMap:
    `master_db.repository_tag_id_map_${hydrusConfig.tagRepository}`,
  repositoryHashIdMapTags:
    `master_db.repository_hash_id_map_${hydrusConfig.tagRepository}`,
  currentFiles:
    `main.current_files_${hydrusConfig.fileRepository}`,
  repositoryHashIdMapFiles:
    `master_db.repository_hash_id_map_${hydrusConfig.fileRepository}`
}
