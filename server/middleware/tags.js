const { check, validationResult } = require('express-validator/check')
const { sanitizeBody, sanitizeQuery } = require('express-validator/filter')

module.exports = {
  get: {
    inputValidationConfig: [
      sanitizeQuery('page').trim(),
      check('page')
        .exists().withMessage('MissingPageParameterError')
        .isInt({ min: 1 }).withMessage('InvalidPageParameterError')
    ],
    validateInput: (req, res, next) => {
      const err = validationResult(req)

      if (!err.isEmpty()) {
        return next({
          customStatus: 400,
          customName: err.array()[0].msg
        })
      }

      next()
    }
  },
  autocomplete: {
    inputValidationConfig: [
      sanitizeBody('partialTag').trim(),
      check('partialTag')
        .exists().withMessage('MissingPartialTagFieldError')
        .isString().withMessage('InvalidPartialTagFieldError')
        .isLength({ min: 1 }).withMessage('InvalidPartialTagFieldError')
    ],
    validateInput: (req, res, next) => {
      const err = validationResult(req)

      if (!err.isEmpty()) {
        return next({
          customStatus: 400,
          customName: err.array()[0].msg
        })
      }

      next()
    }
  }
}
