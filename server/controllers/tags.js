const tags = require('../models/tags')

module.exports = {
  getTags (page) {
    return tags.get(page)
  },
  getTagsOfFile (fileId) {
    return tags.getOfFile(fileId)
  },
  autocompleteTag (partialTag) {
    return tags.autocomplete(partialTag)
  },
  getNamespaces () {
    return tags.getNamespaces()
  },
  getTotalTagCount () {
    return tags.getTotalCount()
  }
}
