const express = require('express');
const router = express.Router();
const searchController = require('./search.controller');
const { validateSearchQuery, validateSuggestQuery } = require('./search.validator');

/**
 * GET /search
 * Full-text search with faceted filters
 */
router.get('/', validateSearchQuery, searchController.search);

/**
 * GET /search/autocomplete
 * Autocomplete / suggest endpoint
 */
router.get('/autocomplete', validateSuggestQuery, searchController.suggest);

module.exports = router;
