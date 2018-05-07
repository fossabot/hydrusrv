const { check, validationResult } = require('express-validator/check')
const { sanitizeParam } = require('express-validator/filter')

module.exports = {
  get: {
    inputValidationConfig: [
      sanitizeParam('mediaHash').trim(),
      check('mediaHash')
        .exists().withMessage('MissingMediaHashParameterError')
        .isString().withMessage('InvalidMediaHashParameterError')
        .isLength({ min: 1 }).withMessage('InvalidMediaHashParameterError')
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
