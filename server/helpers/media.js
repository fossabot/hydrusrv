const fs = require('fs')
const fileType = require('file-type')
const readChunk = require('read-chunk')

const hydrusConfig = require('../config/hydrus')

module.exports = {
  fileExists (type, hash) {
    const directory = hash.substring(0, 2)
    const extension = type === 'thumbnail' ? '.thumbnail' : ''
    const filePath =
      `${hydrusConfig.filesPath}/${directory}/${hash}${extension}`

    return fs.existsSync(filePath)
  },
  getFileData (type, hash) {
    const directory = hash.substring(0, 2)
    const extension = type === 'thumbnail' ? '.thumbnail' : ''
    const filePath =
      `${hydrusConfig.filesPath}/${directory}/${hash}${extension}`

    try {
      return {
        path: filePath,
        mimeType: fileType(readChunk.sync(filePath, 0, 4100)).mime
      }
    } catch (err) {
      throw err
    }
  }
}
