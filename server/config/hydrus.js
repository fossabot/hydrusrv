const availableMimeTypes = {
  1: 'image/jpeg',
  2: 'image/png',
  3: 'image/gif',
  4: 'image/bmp',
  9: 'video/x-flv',
  14: 'video/mp4',
  18: 'video/x-ms-wmv',
  20: 'video/x-matroska',
  21: 'video/webm',
  23: 'image/apng',
  25: 'video/mpeg',
  26: 'video/quicktime',
  27: 'video/x-msvideo'
}

const supportedMimeTypes = () => {
  return process.env.HYDRUS_SUPPORTED_MIME_TYPES.split(',').filter(
    mimeType => {
      return (parseInt(mimeType) in availableMimeTypes)
    }
  )
}

module.exports = {
  filesPath: process.env.HYDRUS_FILES_PATH,
  tagRepository: process.env.HYDRUS_TAG_REPOSITORY,
  fileRepository: process.env.HYDRUS_FILE_REPOSITORY,
  availableMimeTypes: availableMimeTypes,
  supportedMimeTypes: supportedMimeTypes(),
  mimePlaceholders: ',?'.repeat(supportedMimeTypes().length).replace(
    ',', ''
  )
}
