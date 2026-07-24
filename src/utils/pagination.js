/**
 * Parse and sanitize page and limit query parameters.
 *
 * @param {object} query - Express req.query object
 * @param {number} [defaultLimit=20] - Default page size
 * @param {number} [maxLimit=100] - Maximum allowed page size
 * @returns {{ page: number, limit: number, offset: number }}
 */
const parsePagination = (query, defaultLimit = 20, maxLimit = 100) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isFinite(page) || page < 1) {
    page = 1;
  }

  if (!Number.isFinite(limit) || limit < 1) {
    limit = defaultLimit;
  }

  if (limit > maxLimit) {
    limit = maxLimit;
  }

  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Build a standardised paginated response envelope.
 *
 * @param {Array}  data       - Array of records for the current page
 * @param {number} total      - Total number of matching records
 * @param {number} page       - Current page number (1-based)
 * @param {number} limit      - Page size
 * @returns {object}
 */
const buildPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

module.exports = { parsePagination, buildPaginatedResponse };
