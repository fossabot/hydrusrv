const fs = require('fs')
const readChunk = require('read-chunk')
const fileType = require('file-type')
const hydrusConfig = require('../config/hydrus')

module.exports = {
  mediaFileExists (type, hash) {
    const directory = hash.substring(0, 2)
    const extension = (type === 'thumbnail') ? '.thumbnail' : ''
    const filePath =
      `${hydrusConfig.filesPath}/${directory}/${hash}${extension}`

    return fs.existsSync(filePath)
  },
  getMediaFileData (type, hash) {
    const directory = hash.substring(0, 2)
    const extension = (type === 'thumbnail') ? '.thumbnail' : ''
    const filePath =
      `${hydrusConfig.filesPath}/${directory}/${hash}${extension}`

    const buffer = readChunk.sync(filePath, 0, 4100)

    return {
      path: filePath,
      mimeType: fileType(buffer).mime
    }
  }
}
