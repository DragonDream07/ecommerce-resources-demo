const db = require('../../db');
const { NotFoundError, ConflictError } = require('../../errors');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildProductFilters(filters) {
  const conditions = ['p.deleted_at IS NULL'];
  const params = [];
  let idx = 1;

  if (filters.categoryId) {
    conditions.push(`p.category_id = $${idx++}`);
    params.push(filters.categoryId);
  }
  if (filters.brandId) {
    conditions.push(`p.brand_id = $${idx++}`);
    params.push(filters.brandId);
  }
  if (filters.search) {
    conditions.push(`(p.name ILIKE $${idx} OR p.description ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }
  if (filters.minPrice) {
    conditions.push(`p.base_price >= $${idx++}`);
    params.push(Number(filters.minPrice));
  }
  if (filters.maxPrice) {
    conditions.push(`p.base_price <= $${idx++}`);
    params.push(Number(filters.maxPrice));
  }

  return { conditions, params, idx };
}

function resolveSortClause(sort) {
  const allowed = {
    price_asc: 'p.base_price ASC',
    price_desc: 'p.base_price DESC',
    name_asc: 'p.name ASC',
    name_desc: 'p.name DESC',
    created_asc: 'p.created_at ASC',
    created_desc: 'p.created_at DESC',
  };
  return allowed[sort] || 'p.created_at DESC';
}

// ─── Products ─────────────────────────────────────────────────────────────────

async function listProducts(filters = {}) {
  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const { conditions, params, idx } = buildProductFilters(filters);
  const sortClause = resolveSortClause(filters.sort);
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*) AS total FROM products p ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const dataParams = [...params, limit, offset];
  const rows = await db.query(
    `SELECT p.*, b.name AS brand_name, c.name AS category_name
     FROM products p
     LEFT JOIN brands b ON b.id = p.brand_id
     LEFT JOIN categories c ON c.id = p.category_id
     ${whereClause}
     ORDER BY ${sortClause}
     LIMIT $${idx} OFFSET $${idx + 1}`,
    dataParams
  );

  return {
    data: rows.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getProductById(productId) {
  const result = await db.query(
    `SELECT p.*, b.name AS brand_name, c.name AS category_name
     FROM products p
     LEFT JOIN brands b ON b.id = p.brand_id
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [productId]
  );
  if (!result.rows.length) {
    throw new NotFoundError('Product not found.');
  }
  return result.rows[0];
}

async function createProduct(data) {
  const {
    name,
    description,
    base_price,
    category_id,
    brand_id,
    status,
    attributes,
  } = data;

  if (category_id) {
    await getCategoryById(category_id);
  }
  if (brand_id) {
    await getBrandById(brand_id);
  }

  const result = await db.query(
    `INSERT INTO products (name, description, base_price, category_id, brand_id, status, attributes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      name,
      description || null,
      base_price,
      category_id || null,
      brand_id || null,
      status || 'active',
      attributes ? JSON.stringify(attributes) : null,
    ]
  );
  return result.rows[0];
}

async function updateProduct(productId, data) {
  await getProductById(productId);

  if (data.category_id) {
    await getCategoryById(data.category_id);
  }
  if (data.brand_id) {
    await getBrandById(data.brand_id);
  }

  const fields = [];
  const params = [];
  let idx = 1;

  const allowed = ['name', 'description', 'base_price', 'category_id', 'brand_id', 'status', 'attributes'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      params.push(key === 'attributes' ? JSON.stringify(data[key]) : data[key]);
    }
  }

  if (!fields.length) {
    return getProductById(productId);
  }

  fields.push(`updated_at = NOW()`);
  params.push(productId);

  const result = await db.query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
    params
  );
  return result.rows[0];
}

async function deleteProduct(productId) {
  const product = await getProductById(productId);

  await db.query(
    `UPDATE products SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [productId]
  );
}

// ─── Product Images ───────────────────────────────────────────────────────────

async function listProductImages(productId) {
  await getProductById(productId);

  const result = await db.query(
    `SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC, created_at ASC`,
    [productId]
  );
  return result.rows;
}

async function addProductImage(productId, data) {
  await getProductById(productId);

  const { url, alt_text, sort_order } = data;

  const result = await db.query(
    `INSERT INTO product_images (product_id, url, alt_text, sort_order)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [productId, url, alt_text || null, sort_order || 0]
  );
  return result.rows[0];
}

async function deleteProductImage(productId, imageId) {
  await getProductById(productId);

  const result = await db.query(
    `DELETE FROM product_images WHERE id = $1 AND product_id = $2 RETURNING id`,
    [imageId, productId]
  );
  if (!result.rows.length) {
    throw new NotFoundError('Product image not found.');
  }
}

// ─── SKUs ─────────────────────────────────────────────────────────────────────

async function listProductSkus(productId) {
  await getProductById(productId);

  const result = await db.query(
    `SELECT * FROM skus WHERE product_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC`,
    [productId]
  );
  return result.rows;
}

async function getProductSkuById(productId, skuId) {
  await getProductById(productId);

  const result = await db.query(
    `SELECT * FROM skus WHERE id = $1 AND product_id = $2 AND deleted_at IS NULL`,
    [skuId, productId]
  );
  if (!result.rows.length) {
    throw new NotFoundError('SKU not found.');
  }
  return result.rows[0];
}

async function createProductSku(productId, data) {
  await getProductById(productId);

  const { sku_code, price, stock_quantity, attributes } = data;

  const existing = await db.query(
    `SELECT id FROM skus WHERE sku_code = $1 AND deleted_at IS NULL`,
    [sku_code]
  );
  if (existing.rows.length) {
    throw new ConflictError('SKU code already exists.');
  }

  const result = await db.query(
    `INSERT INTO skus (product_id, sku_code, price, stock_quantity, attributes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      productId,
      sku_code,
      price,
      stock_quantity || 0,
      attributes ? JSON.stringify(attributes) : null,
    ]
  );
  return result.rows[0];
}

async function updateProductSku(productId, skuId, data) {
  await getProductSkuById(productId, skuId);

  if (data.sku_code) {
    const existing = await db.query(
      `SELECT id FROM skus WHERE sku_code = $1 AND id <> $2 AND deleted_at IS NULL`,
      [data.sku_code, skuId]
    );
    if (existing.rows.length) {
      throw new ConflictError('SKU code already exists.');
    }
  }

  const fields = [];
  const params = [];
  let idx = 1;

  const allowed = ['sku_code', 'price', 'stock_quantity', 'attributes'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      params.push(key === 'attributes' ? JSON.stringify(data[key]) : data[key]);
    }
  }

  if (!fields.length) {
    return getProductSkuById(productId, skuId);
  }

  fields.push(`updated_at = NOW()`);
  params.push(skuId);
  params.push(productId);

  const result = await db.query(
    `UPDATE skus SET ${fields.join(', ')} WHERE id = $${idx} AND product_id = $${idx + 1} AND deleted_at IS NULL RETURNING *`,
    params
  );
  return result.rows[0];
}

async function deleteProductSku(productId, skuId) {
  await getProductSkuById(productId, skuId);

  await db.query(
    `UPDATE skus SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND product_id = $2`,
    [skuId, productId]
  );
}

async function getSkuStock(skuId) {
  const result = await db.query(
    `SELECT stock_quantity FROM skus WHERE id = $1 AND deleted_at IS NULL`,
    [skuId]
  );
  if (!result.rows.length) {
    throw new NotFoundError('SKU not found.');
  }
  return result.rows[0].stock_quantity;
}

// ─── Categories ───────────────────────────────────────────────────────────────

async function listCategories(query = {}) {
  const parentId = query.parentId || null;
  let rows;

  if (parentId) {
    rows = await db.query(
      `SELECT * FROM categories WHERE parent_id = $1 AND deleted_at IS NULL ORDER BY name ASC`,
      [parentId]
    );
  } else {
    rows = await db.query(
      `SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY name ASC`
    );
  }
  return rows.rows;
}

async function getCategoryById(categoryId) {
  const result = await db.query(
    `SELECT * FROM categories WHERE id = $1 AND deleted_at IS NULL`,
    [categoryId]
  );
  if (!result.rows.length) {
    throw new NotFoundError('Category not found.');
  }
  return result.rows[0];
}

async function createCategory(data) {
  const { name, description, parent_id, image_url } = data;

  if (parent_id) {
    await getCategoryById(parent_id);
  }

  const existing = await db.query(
    `SELECT id FROM categories WHERE name = $1 AND deleted_at IS NULL`,
    [name]
  );
  if (existing.rows.length) {
    throw new ConflictError('Category name already exists.');
  }

  const result = await db.query(
    `INSERT INTO categories (name, description, parent_id, image_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, description || null, parent_id || null, image_url || null]
  );
  return result.rows[0];
}

async function updateCategory(categoryId, data) {
  await getCategoryById(categoryId);

  if (data.parent_id) {
    await getCategoryById(data.parent_id);
  }

  if (data.name) {
    const existing = await db.query(
      `SELECT id FROM categories WHERE name = $1 AND id <> $2 AND deleted_at IS NULL`,
      [data.name, categoryId]
    );
    if (existing.rows.length) {
      throw new ConflictError('Category name already exists.');
    }
  }

  const fields = [];
  const params = [];
  let idx = 1;

  const allowed = ['name', 'description', 'parent_id', 'image_url'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      params.push(data[key]);
    }
  }

  if (!fields.length) {
    return getCategoryById(categoryId);
  }

  fields.push(`updated_at = NOW()`);
  params.push(categoryId);

  const result = await db.query(
    `UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
    params
  );
  return result.rows[0];
}

async function deleteCategory(categoryId) {
  await getCategoryById(categoryId);

  const products = await db.query(
    `SELECT id FROM products WHERE category_id = $1 AND deleted_at IS NULL LIMIT 1`,
    [categoryId]
  );
  if (products.rows.length) {
    throw new ConflictError('Cannot delete a category that has associated products.');
  }

  await db.query(
    `UPDATE categories SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [categoryId]
  );
}

// ─── Brands ───────────────────────────────────────────────────────────────────

async function listBrands(query = {}) {
  const result = await db.query(
    `SELECT * FROM brands WHERE deleted_at IS NULL ORDER BY name ASC`
  );
  return result.rows;
}

async function getBrandById(brandId) {
  const result = await db.query(
    `SELECT * FROM brands WHERE id = $1 AND deleted_at IS NULL`,
    [brandId]
  );
  if (!result.rows.length) {
    throw new NotFoundError('Brand not found.');
  }
  return result.rows[0];
}

async function createBrand(data) {
  const { name, description, image_url } = data;

  const existing = await db.query(
    `SELECT id FROM brands WHERE name = $1 AND deleted_at IS NULL`,
    [name]
  );
  if (existing.rows.length) {
    throw new ConflictError('Brand name already exists.');
  }

  const result = await db.query(
    `INSERT INTO brands (name, description, image_url)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, description || null, image_url || null]
  );
  return result.rows[0];
}

async function updateBrand(brandId, data) {
  await getBrandById(brandId);

  if (data.name) {
    const existing = await db.query(
      `SELECT id FROM brands WHERE name = $1 AND id <> $2 AND deleted_at IS NULL`,
      [data.name, brandId]
    );
    if (existing.rows.length) {
      throw new ConflictError('Brand name already exists.');
    }
  }

  const fields = [];
  const params = [];
  let idx = 1;

  const allowed = ['name', 'description', 'image_url'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      params.push(data[key]);
    }
  }

  if (!fields.length) {
    return getBrandById(brandId);
  }

  fields.push(`updated_at = NOW()`);
  params.push(brandId);

  const result = await db.query(
    `UPDATE brands SET ${fields.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
    params
  );
  return result.rows[0];
}

async function deleteBrand(brandId) {
  await getBrandById(brandId);

  const products = await db.query(
    `SELECT id FROM products WHERE brand_id = $1 AND deleted_at IS NULL LIMIT 1`,
    [brandId]
  );
  if (products.rows.length) {
    throw new ConflictError('Cannot delete a brand that has associated products.');
  }

  await db.query(
    `UPDATE brands SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [brandId]
  );
}

module.exports = {
  // Products
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  // Product Images
  listProductImages,
  addProductImage,
  deleteProductImage,
  // SKUs
  listProductSkus,
  getProductSkuById,
  createProductSku,
  updateProductSku,
  deleteProductSku,
  getSkuStock,
  // Categories
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  // Brands
  listBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
};
