const files = require('../models/files')

module.exports = {
  getFiles (query) {
    if (query.tags) {
      if (query.sort) {
        return files.getByTagsSortedByNamespaces(
          query.page, query.tags, query.sort
        )
      }

      return files.getByTags(query.page, query.tags)
    } else if (query.sort) {
      return files.getSortedByNamespaces(query.page, query.sort)
    }

    return files.get(query.page)
  },
  getTotalFileCount () {
    return files.getTotalCount()
  },
  getFileById (id) {
    return files.getById(id)
  }
}
