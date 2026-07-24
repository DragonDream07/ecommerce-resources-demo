const searchService = require('./search.service');

/**
 * Handle GET /search
 */
async function search(req, res, next) {
  try {
    const { q, filters, page, size } = req.query;

    const parsedFilters = filters ? JSON.parse(filters) : {};
    const parsedPage = page !== undefined ? parseInt(page, 10) : 1;
    const parsedSize = size !== undefined ? parseInt(size, 10) : 10;

    const result = await searchService.search({
      query: q || '',
      filters: parsedFilters,
      page: parsedPage,
      size: parsedSize,
    });

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

/**
 * Handle GET /search/autocomplete
 */
async function suggest(req, res, next) {
  try {
    const { q, size } = req.query;

    const parsedSize = size !== undefined ? parseInt(size, 10) : 5;

    const result = await searchService.suggest({
      query: q || '',
      size: parsedSize,
    });

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { search, suggest };
