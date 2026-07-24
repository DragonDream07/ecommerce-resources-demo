const Joi = require('joi');

// ─── Products ─────────────────────────────────────────────────────────────────

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Product name is required.',
    'any.required': 'Product name is required.',
    'string.max': 'Product name must not exceed 255 characters.',
  }),
  description: Joi.string().trim().max(5000).optional().allow('', null).messages({
    'string.max': 'Product description must not exceed 5000 characters.',
  }),
  base_price: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Base price must be a valid number.',
    'number.positive': 'Base price must be a positive number.',
    'any.required': 'Base price is required.',
  }),
  category_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'category_id must be a valid UUID.',
  }),
  brand_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'brand_id must be a valid UUID.',
  }),
  status: Joi.string().valid('active', 'inactive', 'draft').optional().default('active').messages({
    'any.only': 'Status must be one of: active, inactive, draft.',
  }),
  attributes: Joi.object().optional().allow(null),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional().messages({
    'string.empty': 'Product name must not be empty.',
    'string.max': 'Product name must not exceed 255 characters.',
  }),
  description: Joi.string().trim().max(5000).optional().allow('', null).messages({
    'string.max': 'Product description must not exceed 5000 characters.',
  }),
  base_price: Joi.number().positive().precision(2).optional().messages({
    'number.base': 'Base price must be a valid number.',
    'number.positive': 'Base price must be a positive number.',
  }),
  category_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'category_id must be a valid UUID.',
  }),
  brand_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'brand_id must be a valid UUID.',
  }),
  status: Joi.string().valid('active', 'inactive', 'draft').optional().messages({
    'any.only': 'Status must be one of: active, inactive, draft.',
  }),
  attributes: Joi.object().optional().allow(null),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

// ─── Product Images ───────────────────────────────────────────────────────────

const addProductImageSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    'string.empty': 'Image URL is required.',
    'string.uri': 'Image URL must be a valid URL.',
    'any.required': 'Image URL is required.',
  }),
  alt_text: Joi.string().trim().max(255).optional().allow('', null).messages({
    'string.max': 'Alt text must not exceed 255 characters.',
  }),
  sort_order: Joi.number().integer().min(0).optional().default(0).messages({
    'number.base': 'Sort order must be a valid integer.',
    'number.min': 'Sort order must be 0 or greater.',
  }),
});

// ─── SKUs ─────────────────────────────────────────────────────────────────────

const createSkuSchema = Joi.object({
  sku_code: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'SKU code is required.',
    'any.required': 'SKU code is required.',
    'string.max': 'SKU code must not exceed 100 characters.',
  }),
  price: Joi.number().positive().precision(2).required().messages({
    'number.base': 'SKU price must be a valid number.',
    'number.positive': 'SKU price must be a positive number.',
    'any.required': 'SKU price is required.',
  }),
  stock_quantity: Joi.number().integer().min(0).optional().default(0).messages({
    'number.base': 'Stock quantity must be a valid integer.',
    'number.min': 'Stock quantity must be 0 or greater.',
  }),
  attributes: Joi.object().optional().allow(null),
});

const updateSkuSchema = Joi.object({
  sku_code: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': 'SKU code must not be empty.',
    'string.max': 'SKU code must not exceed 100 characters.',
  }),
  price: Joi.number().positive().precision(2).optional().messages({
    'number.base': 'SKU price must be a valid number.',
    'number.positive': 'SKU price must be a positive number.',
  }),
  stock_quantity: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Stock quantity must be a valid integer.',
    'number.min': 'Stock quantity must be 0 or greater.',
  }),
  attributes: Joi.object().optional().allow(null),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

// ─── Categories ───────────────────────────────────────────────────────────────

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Category name is required.',
    'any.required': 'Category name is required.',
    'string.max': 'Category name must not exceed 255 characters.',
  }),
  description: Joi.string().trim().max(2000).optional().allow('', null).messages({
    'string.max': 'Category description must not exceed 2000 characters.',
  }),
  parent_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'parent_id must be a valid UUID.',
  }),
  image_url: Joi.string().uri().optional().allow('', null).messages({
    'string.uri': 'Category image URL must be a valid URL.',
  }),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional().messages({
    'string.empty': 'Category name must not be empty.',
    'string.max': 'Category name must not exceed 255 characters.',
  }),
  description: Joi.string().trim().max(2000).optional().allow('', null).messages({
    'string.max': 'Category description must not exceed 2000 characters.',
  }),
  parent_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'parent_id must be a valid UUID.',
  }),
  image_url: Joi.string().uri().optional().allow('', null).messages({
    'string.uri': 'Category image URL must be a valid URL.',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

// ─── Brands ───────────────────────────────────────────────────────────────────

const createBrandSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Brand name is required.',
    'any.required': 'Brand name is required.',
    'string.max': 'Brand name must not exceed 255 characters.',
  }),
  description: Joi.string().trim().max(2000).optional().allow('', null).messages({
    'string.max': 'Brand description must not exceed 2000 characters.',
  }),
  image_url: Joi.string().uri().optional().allow('', null).messages({
    'string.uri': 'Brand image URL must be a valid URL.',
  }),
});

const updateBrandSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional().messages({
    'string.empty': 'Brand name must not be empty.',
    'string.max': 'Brand name must not exceed 255 characters.',
  }),
  description: Joi.string().trim().max(2000).optional().allow('', null).messages({
    'string.max': 'Brand description must not exceed 2000 characters.',
  }),
  image_url: Joi.string().uri().optional().allow('', null).messages({
    'string.uri': 'Brand image URL must be a valid URL.',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  addProductImageSchema,
  createSkuSchema,
  updateSkuSchema,
  createCategorySchema,
  updateCategorySchema,
  createBrandSchema,
  updateBrandSchema,
};
