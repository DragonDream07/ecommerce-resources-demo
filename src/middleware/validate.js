'use strict';

/**
 * Generic Joi validation middleware factory.
 * Validates the specified part of the request against the provided schema.
 *
 * @param {import('joi').Schema} schema - Joi schema to validate against.
 * @param {'body'|'query'|'params'} [source='body'] - Request property to validate.
 * @returns {Function} Express middleware
 */
function validate(schema, source = 'body') {
  return function validationMiddleware(req, res, next) {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));

      return res.status(400).json({
        status: 400,
        error: 'Bad Request',
        message: 'Validation failed.',
        details,
      });
    }

    // Replace the source with the coerced/stripped value
    req[source] = value;
    return next();
  };
}

module.exports = validate;
