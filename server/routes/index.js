const config = require('../config/app')
const middleware = require('../middleware')
const controllers = require('../controllers')
const mediaHelper = require('../helpers/media')

module.exports = app => {
  app.get(`${config.apiBase}`, (req, res, next) => {
    res.send({
      hydrusrv: {
        version: '1.5.0'
      }
    })
  })

  app.get(`${config.apiBase}/info`,
    middleware.auth.validateToken,
    (req, res, next) => {
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
        tagCount: data.tags.count,
        fileCount: data.files.count
      })
    }
  )

  app.get(`${config.apiBase}/namespaces`,
    middleware.auth.validateToken,
    (req, res, next) => {
      const data = {}

      try {
        data.namespaces = controllers.tags.getNamespaces()
      } catch (err) {
        return next(err)
      }

      res.send(data.namespaces)
    }
  )

  app.get(`${config.apiBase}/tags`,
    middleware.auth.validateToken,
    middleware.tags.get.inputValidationConfig,
    middleware.tags.get.validateInput,
    (req, res, next) => {
      const data = {}

      try {
        data.tags = controllers.tags.getTags(req.query.page)
      } catch (err) {
        return next(err)
      }

      res.send(data.tags)
    }
  )

  app.post(`${config.apiBase}/autocomplete-tag`,
    middleware.auth.validateToken,
    middleware.tags.autocomplete.inputValidationConfig,
    middleware.tags.autocomplete.validateInput,
    (req, res, next) => {
      const data = {}

      try {
        data.tags = controllers.tags.autocompleteTag(req.body.partialTag)
      } catch (err) {
        return next(err)
      }

      res.send(data.tags)
    }
  )

  app.get(`${config.apiBase}/files`,
    middleware.auth.validateToken,
    middleware.files.get.inputValidationConfig,
    middleware.files.get.validateInput,
    (req, res, next) => {
      const data = {}

      try {
        data.files = controllers.files.getFiles(req.query)
      } catch (err) {
        return next(err)
      }

      res.send(data.files)
    }
  )

  app.get(`${config.apiBase}/files/:fileId`,
    middleware.auth.validateToken,
    middleware.files.getSingle.inputValidationConfig,
    middleware.files.getSingle.validateInput,
    (req, res, next) => {
      const data = {}

      try {
        data.file = controllers.files.getFileById(req.params.fileId)
      } catch (err) {
        return next(err)
      }

      if (!data.file) {
        return next({
          customStatus: 404,
          customName: 'NotFoundError'
        })
      }

      let tags

      try {
        tags = controllers.tags.getTagsOfFile(req.params.fileId)
      } catch (err) {
        return next(err)
      }

      data.file.tags = tags

      res.send(data.file)
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

  app.post(`${config.apiBase}/users`,
    middleware.auth.createUser.inputValidationConfig,
    middleware.auth.createUser.validateInput,
    async (req, res, next) => {
      try {
        if (controllers.auth.getUserByName(req.body.username)) {
          return next({
            customStatus: 400,
            customName: 'UsernameExistsError'
          })
        }
      } catch (err) {
        return next(err)
      }

      try {
        await controllers.auth.createUser(
          req.body.username, req.body.password
        )
      } catch (err) {
        return next(err)
      }

      res.send({
        createdUser: true
      })
    }
  )

  app.put(`${config.apiBase}/users`,
    middleware.auth.validateToken,
    middleware.auth.updateUser.inputValidationConfig,
    middleware.auth.updateUser.validateInput,
    async (req, res, next) => {
      if (!(req.body.username || req.body.password)) {
        return next({
          customStatus: 400,
          customName: 'NoUpdateFieldsError'
        })
      }

      if (req.body.username) {
        try {
          if (controllers.auth.getUserByName(req.body.username)) {
            return next({
              customStatus: 400,
              customName: 'UsernameExistsError'
            })
          }
        } catch (err) {
          return next(err)
        }
      }

      let validUser

      try {
        validUser = await controllers.auth.getValidUser(
          res.locals.userId, req.body.currentPassword
        )

        if (!validUser) {
          return next({
            customStatus: 400,
            customName: 'InvalidUserError'
          })
        }
      } catch (err) {
        return next(err)
      }

      try {
        await controllers.auth.updateUser(
          res.locals.userId, req.body
        )
      } catch (err) {
        return next(err)
      }

      res.send({
        updatedUser: true
      })
    }
  )

  app.delete(`${config.apiBase}/users`,
    middleware.auth.validateToken,
    (req, res, next) => {
      try {
        controllers.auth.deleteUser(
          res.locals.userId
        )
      } catch (err) {
        return next(err)
      }

      res.send({
        deletedUser: true
      })
    }
  )

  app.post(`${config.apiBase}/tokens`,
    middleware.auth.createToken.inputValidationConfig,
    middleware.auth.createToken.validateInput,
    async (req, res, next) => {
      let validUser

      try {
        validUser = await controllers.auth.getValidUser(
          req.body.username, req.body.password, true
        )

        if (!validUser) {
          return next({
            customStatus: 400,
            customName: 'InvalidUserError'
          })
        }
      } catch (err) {
        return next(err)
      }

      const data = {}

      try {
        data.token = controllers.auth.createToken(
          validUser.id, req.body.long
        )
      } catch (err) {
        return next(err)
      }

      res.send({
        token: data.token.hash
      })
    }
  )

  app.delete(`${config.apiBase}/tokens`,
    middleware.auth.validateToken,
    middleware.auth.deleteToken.inputValidationConfig,
    middleware.auth.deleteToken.validateInput,
    (req, res, next) => {
      try {
        controllers.auth.deleteTokens(
          res.locals.userId, res.locals.token, req.body.all
        )
      } catch (err) {
        return next(err)
      }

      res.send({
        deletedTokens: true
      })
    }
  )
}
