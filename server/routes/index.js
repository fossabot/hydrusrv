const config = require('../config/app')
const controllers = require('../controllers')
const middleware = require('../middleware')
const mediaHelper = require('../helpers/media')

module.exports = app => {
  app.get(`${config.apiBase}/info`, (req, res, next) => {
    const data = {}

    try {
      data.tags = controllers.tags.getTotalTagCount()
    } catch (err) {
      return next(err)
    }

    try {
      data.files = controllers.files.getTotalFileCount()
    } catch (err) {
      return next(err)
    }

    res.send({
      info: {
        tagCount: data.tags.count,
        fileCount: data.files.count
      }
    })
  })

  app.get(`${config.apiBase}/namespaces`, (req, res, next) => {
    const data = {}

    try {
      data.namespaces = controllers.tags.getNamespaces()
    } catch (err) {
      return next(err)
    }

    res.send({
      namespaces: data.namespaces
    })
  })

  app.get(`${config.apiBase}/tags`,
    middleware.tags.get.inputValidationConfig,
    middleware.tags.get.validateInput,
    (req, res, next) => {
      const data = {}

      try {
        data.tags = controllers.tags.getTags(req.query.page)
      } catch (err) {
        return next(err)
      }

      res.send({
        tags: data.tags
      })
    }
  )

  app.post(`${config.apiBase}/autocomplete-tag`,
    middleware.tags.autocomplete.inputValidationConfig,
    middleware.tags.autocomplete.validateInput,
    (req, res, next) => {
      const data = {}

      try {
        data.tags = controllers.tags.autocompleteTag(req.body.partialTag)
      } catch (err) {
        return next(err)
      }

      res.send({
        tags: data.tags
      })
    }
  )

  app.get(`${config.apiBase}/files`,
    middleware.files.get.inputValidationConfig,
    middleware.files.get.validateInput,
    (req, res, next) => {
      const data = {}

      try {
        data.files = controllers.files.getFiles(req.query)
      } catch (err) {
        return next(err)
      }

      res.send({
        files: data.files
      })
    }
  )

  app.get(`${config.apiBase}/files/:fileId`,
    middleware.files.getSingle.inputValidationConfig,
    middleware.files.getSingle.validateInput,
    (req, res, next) => {
      const data = {}

      try {
        data.file = controllers.files.getFileById(req.params.fileId)
      } catch (err) {
        return next(err)
      }

      if (data.file) {
        let tags

        try {
          tags = controllers.tags.getTagsOfFile(req.params.fileId)
        } catch (err) {
          return next(err)
        }

        data.file.tags = tags
      }

      res.send({
        files: (data.file) ? [data.file] : []
      })
    }
  )

  app.get(`${config.mediaBase}/original/:mediaHash`,
    middleware.media.get.inputValidationConfig,
    middleware.media.get.validateInput,
    (req, res, next) => {
      if (!mediaHelper.mediaFileExists('original', req.params.mediaHash)) {
        return next()
      }

      const fileData = mediaHelper.getMediaFileData(
        'original', req.params.mediaHash
      )

      res.sendFile(fileData.path, {
        headers: {
          'Content-Type': fileData.mimeType
        }
      })
    }
  )

  app.get(`${config.mediaBase}/thumbnails/:mediaHash`,
    middleware.media.get.inputValidationConfig,
    middleware.media.get.validateInput,
    (req, res, next) => {
      if (!mediaHelper.mediaFileExists('thumbnail', req.params.mediaHash)) {
        return next()
      }

      const fileData = mediaHelper.getMediaFileData(
        'thumbnail', req.params.mediaHash
      )

      res.sendFile(fileData.path, {
        headers: {
          'Content-Type': fileData.mimeType
        }
      })
    }
  )
}
