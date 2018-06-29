const files = require('../models/files')

module.exports = {
  getFiles (query) {
    if (query.tags) {
      switch (query.sort) {
        case 'random':
          return files.getByTagsSortedRandomly(query.page, query.tags)
        case 'namespace':
          return files.getByTagsSortedByNamespaces(
            query.page, query.tags, query.namespace
          )
      }

      return files.getByTags(query.page, query.tags)
    }

    switch (query.sort) {
      case 'random':
        return files.getSortedRandomly(query.page)
      case 'namespace':
        return files.getSortedByNamespaces(query.page, query.namespace)
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
