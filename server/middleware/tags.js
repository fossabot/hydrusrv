const { check, validationResult } = require('express-validator/check')
const { sanitizeBody, sanitizeQuery } = require('express-validator/filter')

module.exports = {
  get: {
    inputValidationConfig: [
      sanitizeQuery('page').trim(),
      check('page')
        .exists().withMessage('InvalidParameterError')
        .isInt({ min: 1 }).withMessage('InvalidParameterError')
    ],
    validateInput: (req, res, next) => {
      const err = validationResult(req)

      if (!err.isEmpty()) {
        return next({
          customStatus: 400,
          customTitle: 'Invalid parameters',
          customName: err.array()[0].msg,
          customDescription:
            'One or more of the required parameters were invalid or missing.'
        })
      }

      next()
    }
  },
  autocomplete: {
    inputValidationConfig: [
      sanitizeBody('partialTag').trim(),
      check('partialTag')
        .exists().withMessage('InvalidFieldError')
        .isString().withMessage('InvalidFieldError')
        .isLength({ min: 1 }).withMessage('InvalidFieldError')
    ],
    validateInput: (req, res, next) => {
      const err = validationResult(req)

      if (!err.isEmpty()) {
        return next({
          customStatus: 400,
          customTitle: 'Invalid fields',
          customName: err.array()[0].msg,
          customDescription:
            'One or more of the necessary fields were invalid or missing.'
        })
      }

      next()
    }
  }
}
