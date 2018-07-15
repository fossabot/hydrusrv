const hydrusConfig = require('./hydrus')

module.exports = {
  tags: 'master_db.tags',
  hashes: 'master_db.hashes',
  filesInfo: 'main.files_info',
  currentMappings:
    `mappings_db.current_mappings_${hydrusConfig.tagRepository}`,
  repositoryTagIdMap:
    `master_db.repository_tag_id_map_${hydrusConfig.tagRepository}`,
  repositoryHashIdMapTags:
    `master_db.repository_hash_id_map_${hydrusConfig.tagRepository}`,
  repositoryHashIdMapFiles:
    `master_db.repository_hash_id_map_${hydrusConfig.fileRepository}`,
  currentFiles:
    `main.current_files_${hydrusConfig.fileRepository}`
}
