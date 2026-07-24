const db = require('../knex');

const PRODUCTS_TABLE = 'products';
const IMAGES_TABLE = 'product_images';

// Products
const findById = (id) =>
  db(PRODUCTS_TABLE).where({ id }).first();

const findBySlug = (slug) =>
  db(PRODUCTS_TABLE).where({ slug }).first();

const findAll = ({ limit = 20, offset = 0, categoryId, brandId, isActive } = {}) => {
  const query = db(PRODUCTS_TABLE).limit(limit).offset(offset);
  if (categoryId !== undefined) query.where({ category_id: categoryId });
  if (brandId !== undefined) query.where({ brand_id: brandId });
  if (isActive !== undefined) query.where({ is_active: isActive });
  return query.orderBy('created_at', 'desc');
};

const findByCategoryIds = (categoryIds, { limit = 20, offset = 0 } = {}) =>
  db(PRODUCTS_TABLE)
    .whereIn('category_id', categoryIds)
    .where({ is_active: true })
    .limit(limit)
    .offset(offset)
    .orderBy('created_at', 'desc');

const create = (data) =>
  db(PRODUCTS_TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateById = (id, data) =>
  db(PRODUCTS_TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteById = (id) =>
  db(PRODUCTS_TABLE).where({ id }).del();

const count = (filters = {}) => {
  const query = db(PRODUCTS_TABLE).count('id as total');
  if (filters.categoryId !== undefined) query.where({ category_id: filters.categoryId });
  if (filters.brandId !== undefined) query.where({ brand_id: filters.brandId });
  if (filters.isActive !== undefined) query.where({ is_active: filters.isActive });
  return query.first();
};

// Product Images
const findImagesByProductId = (productId) =>
  db(IMAGES_TABLE).where({ product_id: productId }).orderBy('sort_order', 'asc');

const addImage = (data) =>
  db(IMAGES_TABLE).insert(data).returning('*').then((rows) => rows[0]);

const deleteImageById = (id) =>
  db(IMAGES_TABLE).where({ id }).del();

const deleteImagesByProductId = (productId) =>
  db(IMAGES_TABLE).where({ product_id: productId }).del();

const updateImageById = (id, data) =>
  db(IMAGES_TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const findWithImages = async (id) => {
  const product = await findById(id);
  if (!product) return null;
  const images = await findImagesByProductId(id);
  return { ...product, images };
};

module.exports = {
  findById,
  findBySlug,
  findAll,
  findByCategoryIds,
  create,
  updateById,
  deleteById,
  count,
  findImagesByProductId,
  addImage,
  deleteImageById,
  deleteImagesByProductId,
  updateImageById,
  findWithImages,
};
