const Joi = require('joi');
const { validationMiddleware } = require('../../middleware/validation');

const returnRequestSchema = Joi.object({
  reason: Joi.string().trim().min(10).max(1000).required().messages({
    'string.base': 'Reason must be a string.',
    'string.empty': 'Reason is required.',
    'string.min': 'Reason must be at least 10 characters.',
    'string.max': 'Reason must not exceed 1000 characters.',
    'any.required': 'Reason is required.',
  }),
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.alternatives()
          .try(Joi.string().uuid(), Joi.number().integer().positive())
          .required()
          .messages({
            'any.required': 'Each item must have a product_id.',
          }),
        quantity: Joi.number().integer().min(1).required().messages({
          'number.base': 'Quantity must be a number.',
          'number.integer': 'Quantity must be an integer.',
          'number.min': 'Quantity must be at least 1.',
          'any.required': 'Each item must have a quantity.',
        }),
      })
    )
    .min(1)
    .optional()
    .messages({
      'array.min': 'Items must contain at least one entry.',
    }),
});

const reviewSchema = Joi.object({
  decision: Joi.string().valid('approved', 'rejected').required().messages({
    'string.base': 'Decision must be a string.',
    'any.only': 'Decision must be either approved or rejected.',
    'any.required': 'Decision is required.',
  }),
  notes: Joi.string().trim().max(2000).optional().allow('', null).messages({
    'string.max': 'Notes must not exceed 2000 characters.',
  }),
});

const validateReturnRequest = validationMiddleware(returnRequestSchema);
const validateReview = validationMiddleware(reviewSchema);

module.exports = {
  validateReturnRequest,
  validateReview,
  returnRequestSchema,
  reviewSchema,
};
