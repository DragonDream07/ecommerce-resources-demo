const catalogueService = require('./catalogue.service');

// ─── Products ─────────────────────────────────────────────────────────────────

async function listProducts(req, res, next) {
  try {
    const filters = {
      categoryId: req.query.categoryId,
      brandId: req.query.brandId,
      search: req.query.search,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
    };
    const result = await catalogueService.listProducts(filters);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await catalogueService.getProductById(req.params.productId);
    return res.status(200).json(product);
  } catch (err) {
    return next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const product = await catalogueService.createProduct(req.body);
    return res.status(201).json(product);
  } catch (err) {
    return next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = await catalogueService.updateProduct(req.params.productId, req.body);
    return res.status(200).json(product);
  } catch (err) {
    return next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    await catalogueService.deleteProduct(req.params.productId);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

// ─── Product Images ───────────────────────────────────────────────────────────

async function listProductImages(req, res, next) {
  try {
    const images = await catalogueService.listProductImages(req.params.productId);
    return res.status(200).json(images);
  } catch (err) {
    return next(err);
  }
}

async function addProductImage(req, res, next) {
  try {
    const image = await catalogueService.addProductImage(req.params.productId, req.body);
    return res.status(201).json(image);
  } catch (err) {
    return next(err);
  }
}

async function deleteProductImage(req, res, next) {
  try {
    await catalogueService.deleteProductImage(req.params.productId, req.params.imageId);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

// ─── SKUs ─────────────────────────────────────────────────────────────────────

async function listProductSkus(req, res, next) {
  try {
    const skus = await catalogueService.listProductSkus(req.params.productId);
    return res.status(200).json(skus);
  } catch (err) {
    return next(err);
  }
}

async function getProductSku(req, res, next) {
  try {
    const sku = await catalogueService.getProductSkuById(req.params.productId, req.params.skuId);
    return res.status(200).json(sku);
  } catch (err) {
    return next(err);
  }
}

async function createProductSku(req, res, next) {
  try {
    const sku = await catalogueService.createProductSku(req.params.productId, req.body);
    return res.status(201).json(sku);
  } catch (err) {
    return next(err);
  }
}

async function updateProductSku(req, res, next) {
  try {
    const sku = await catalogueService.updateProductSku(
      req.params.productId,
      req.params.skuId,
      req.body
    );
    return res.status(200).json(sku);
  } catch (err) {
    return next(err);
  }
}

async function deleteProductSku(req, res, next) {
  try {
    await catalogueService.deleteProductSku(req.params.productId, req.params.skuId);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────

async function listCategories(req, res, next) {
  try {
    const categories = await catalogueService.listCategories(req.query);
    return res.status(200).json(categories);
  } catch (err) {
    return next(err);
  }
}

async function getCategory(req, res, next) {
  try {
    const category = await catalogueService.getCategoryById(req.params.categoryId);
    return res.status(200).json(category);
  } catch (err) {
    return next(err);
  }
}

async function listCategoryProducts(req, res, next) {
  try {
    const filters = {
      ...req.query,
      categoryId: req.params.categoryId,
    };
    const result = await catalogueService.listProducts(filters);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const category = await catalogueService.createCategory(req.body);
    return res.status(201).json(category);
  } catch (err) {
    return next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const category = await catalogueService.updateCategory(req.params.categoryId, req.body);
    return res.status(200).json(category);
  } catch (err) {
    return next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    await catalogueService.deleteCategory(req.params.categoryId);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

// ─── Brands ───────────────────────────────────────────────────────────────────

async function listBrands(req, res, next) {
  try {
    const brands = await catalogueService.listBrands(req.query);
    return res.status(200).json(brands);
  } catch (err) {
    return next(err);
  }
}

async function getBrand(req, res, next) {
  try {
    const brand = await catalogueService.getBrandById(req.params.brandId);
    return res.status(200).json(brand);
  } catch (err) {
    return next(err);
  }
}

async function createBrand(req, res, next) {
  try {
    const brand = await catalogueService.createBrand(req.body);
    return res.status(201).json(brand);
  } catch (err) {
    return next(err);
  }
}

async function updateBrand(req, res, next) {
  try {
    const brand = await catalogueService.updateBrand(req.params.brandId, req.body);
    return res.status(200).json(brand);
  } catch (err) {
    return next(err);
  }
}

async function deleteBrand(req, res, next) {
  try {
    await catalogueService.deleteBrand(req.params.brandId);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  // Products
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  // Product Images
  listProductImages,
  addProductImage,
  deleteProductImage,
  // SKUs
  listProductSkus,
  getProductSku,
  createProductSku,
  updateProductSku,
  deleteProductSku,
  // Categories
  listCategories,
  getCategory,
  listCategoryProducts,
  createCategory,
  updateCategory,
  deleteCategory,
  // Brands
  listBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
};
