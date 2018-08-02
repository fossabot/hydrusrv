const files = require('../models/files')

module.exports = {
  getFiles (query) {
    return (query.tags)
      ? files.getByTags(
        query.page,
        query.tags,
        query.sort || 'id',
        query.direction || null,
        query.namespace || []
      )
      : files.get(
        query.page,
        query.sort || 'id',
        query.direction || null,
        query.namespace || []
      )
  },
  getTotalFileCount () {
    return files.getTotalCount()
  },
  getFileById (id) {
    return files.getById(id)
  }
}
