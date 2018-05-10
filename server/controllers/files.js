const files = require('../models/files')

module.exports = {
  getFiles (query) {
    if (query.tags) {
      if (query.sort) {
        return files.getByTagsSortedByNamespace(
          query.page, query.tags, query.sort
        )
      }

      return files.getByTags(query.page, query.tags)
    } else if (query.sort) {
      return files.getSortedByNamespace(query.page, query.sort)
    }

    return files.get(query.page)
  },
  getTotalFileCount () {
    return files.getTotalCount()
  },
  getFileById (fileId) {
    return files.getById(fileId)
  }
}
