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
  let mimeTypes = process.env.HYDRUS_SUPPORTED_MIME_TYPES.split(',')

  mimeTypes = mimeTypes.filter((mimeType) => {
    return (parseInt(mimeType) in availableMimeTypes)
  })

  return mimeTypes
}

module.exports = {
  filesPath: process.env.HYDRUS_FILES_PATH,
  tagRepository: process.env.HYDRUS_TAG_REPOSITORY,
  fileRepository: process.env.HYDRUS_FILE_REPOSITORY,
  resultsPerPage: process.env.HYDRUS_RESULTS_PER_PAGE,
  availableMimeTypes: availableMimeTypes,
  supportedMimeTypes: supportedMimeTypes()
}
