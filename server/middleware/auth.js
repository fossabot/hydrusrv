const { check, validationResult } = require('express-validator/check')
const { sanitizeBody } = require('express-validator/filter')
const config = require('../config/app')
const auth = require('../controllers/auth')

module.exports = {
  validateToken: (req, res, next) => {
    if (!req.headers.authorization) {
      return next({
        customStatus: 403,
        customTitle: 'Missing token',
        customName: 'MissingTokenError',
        customDescription: 'Required access token is missing.'
      })
    }

    let userId
    const hash = req.headers.authorization.replace('Bearer ', '')

    try {
      userId = auth.validateTokenAndGetUserId(hash)
    } catch (err) {
      return next(err)
    }

    if (userId === false) {
      return next({
        customStatus: 403,
        customTitle: 'Invalid token',
        customName: 'InvalidTokenError',
        customDescription: 'Access token is invalid.'
      })
    }

    res.locals.token = hash
    res.locals.userId = userId

    next()
  },
  createUser: {
    inputValidationConfig: [
      sanitizeBody('username').trim(),
      check('username')
        .exists().withMessage('InvalidFieldError')
        .isString().withMessage('InvalidFieldError')
        .isLength({ min: 1, max: 128 }).withMessage('InvalidFieldError'),
      sanitizeBody('password').trim(),
      check('password')
        .exists().withMessage('InvalidFieldError')
        .isString().withMessage('InvalidFieldError')
        .isLength({
          min: config.minPasswordLength,
          max: 128
        }).withMessage('InvalidFieldError')
    ],
    validateInput: (req, res, next) => {
      const err = validationResult(req)

      if (!err.isEmpty()) {
        return next({
          customStatus: 400,
          customTitle: 'Invalid fields',
          customName: err.array()[0].msg,
          customDescription:
            'One or more of the necessary fields are invalid or missing.'
        })
      }

      next()
    }
  },
  updateUser: {
    inputValidationConfig: [
      sanitizeBody('username').trim(),
      check('username')
        .optional()
        .isString().withMessage('InvalidFieldError')
        .isLength({ min: 1, max: 128 }).withMessage('InvalidFieldError'),
      sanitizeBody('password').trim(),
      check('password')
        .optional()
        .isString().withMessage('InvalidFieldError')
        .isLength({
          min: config.minPasswordLength,
          max: 128
        }).withMessage('InvalidFieldError')
    ],
    validateInput: (req, res, next) => {
      const err = validationResult(req)

      if (!err.isEmpty()) {
        return next({
          customStatus: 400,
          customTitle: 'Invalid fields',
          customName: err.array()[0].msg,
          customDescription:
            'One or more of the necessary fields are invalid or missing.'
        })
      }

      next()
    }
  },
  createToken: {
    inputValidationConfig: [
      sanitizeBody('username').trim(),
      check('username')
        .exists().withMessage('InvalidFieldError')
        .isString().withMessage('InvalidFieldError')
        .isLength({ min: 1, max: 128 }).withMessage('InvalidFieldError'),
      sanitizeBody('password').trim(),
      check('password')
        .exists().withMessage('InvalidFieldError')
        .isString().withMessage('InvalidFieldError')
        .isLength({
          min: config.minPasswordLength,
          max: 128
        }).withMessage('InvalidFieldError'),
      check('long')
        .optional()
        .isBoolean().withMessage('InvalidFieldError')
    ],
    validateInput: (req, res, next) => {
      const err = validationResult(req)

      if (!err.isEmpty()) {
        return next({
          customStatus: 400,
          customTitle: 'Invalid fields',
          customName: err.array()[0].msg,
          customDescription:
            'One or more of the necessary fields are invalid or missing.'
        })
      }

      next()
    }
  },
  deleteToken: {
    inputValidationConfig: [
      check('all')
        .optional()
        .isBoolean().withMessage('InvalidFieldError')
    ],
    validateInput: (req, res, next) => {
      const err = validationResult(req)

      if (!err.isEmpty()) {
        return next({
          customStatus: 400,
          customTitle: 'Invalid fields',
          customName: err.array()[0].msg,
          customDescription:
            'One or more of the necessary fields are invalid or missing.'
        })
      }

      next()
    }
  }
}
