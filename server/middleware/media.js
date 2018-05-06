const { check, validationResult } = require('express-validator/check')
const { sanitizeParam } = require('express-validator/filter')

module.exports = {
  get: {
    inputValidationConfig: [
      sanitizeParam('mediaHash').trim(),
      check('mediaHash')
        .exists().withMessage('InvalidParameterError')
        .isString().withMessage('InvalidParameterError')
        .isLength({ min: 1 }).withMessage('InvalidParameterError')
    ],
    validateInput: (req, res, next) => {
      const err = validationResult(req)

      if (!err.isEmpty()) {
        return next({
          customStatus: 400,
          customTitle: 'Invalid parameters',
          customName: err.array()[0].msg,
          customDescription:
            'One or more of the required parameters are invalid or missing.'
        })
      }

      next()
    }
  }
}
