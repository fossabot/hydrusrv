const { check, validationResult } = require('express-validator/check')
const { sanitizeParam, sanitizeQuery } = require('express-validator/filter')

module.exports = {
  get: {
    inputValidationConfig: [
      sanitizeQuery('page').trim(),
      check('page')
        .exists().withMessage('InvalidParameterError')
        .isInt({ min: 1 }).withMessage('InvalidParameterError'),
      sanitizeQuery('tags').trim(),
      check('tags')
        .optional()
        .isArray().withMessage('InvalidParameterError')
        .isLength({ min: 1 }).withMessage('InvalidParameterError'),
      sanitizeQuery('sort').trim(),
      check('sort')
        .optional()
        .isString().withMessage('InvalidFieldError')
        .isLength({ min: 1 }).withMessage('InvalidFieldError')
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
  getSingle: {
    inputValidationConfig: [
      sanitizeParam('fileId').trim(),
      check('fileId')
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
  }
}
