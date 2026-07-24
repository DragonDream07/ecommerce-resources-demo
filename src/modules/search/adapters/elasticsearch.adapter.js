'use strict';

const { Client } = require('@elastic/elasticsearch');

/**
 * Elasticsearch adapter — client wrapper, index mapping helpers, and query builders.
 */

let clientInstance = null;

/**
 * Returns a singleton Elasticsearch client.
 * Configuration is read from environment variables:
 *   ES_NODE      – node URL (default: http://localhost:9200)
 *   ES_USERNAME  – optional basic-auth username
 *   ES_PASSWORD  – optional basic-auth password
 *   ES_TLS_CA    – optional path to CA certificate
 *
 * @returns {Client}
 */
function getClient() {
  if (clientInstance) {
    return clientInstance;
  }

  const node = process.env.ES_NODE || 'http://localhost:9200';

  const options = { node };

  if (process.env.ES_USERNAME && process.env.ES_PASSWORD) {
    options.auth = {
      username: process.env.ES_USERNAME,
      password: process.env.ES_PASSWORD,
    };
  }

  if (process.env.ES_TLS_CA) {
    const fs = require('fs');
    options.tls = {
      ca: fs.readFileSync(process.env.ES_TLS_CA),
      rejectUnauthorized: true,
    };
  }

  clientInstance = new Client(options);
  return clientInstance;
}

// ---------------------------------------------------------------------------
// Index mapping helpers
// ---------------------------------------------------------------------------

/**
 * Default field mappings used when creating a new index.
 * Callers can merge/override these with their own properties.
 */
const DEFAULT_MAPPINGS = {
  dynamic: 'strict',
  properties: {
    id: { type: 'keyword' },
    title: {
      type: 'text',
      analyzer: 'standard',
      fields: {
        keyword: { type: 'keyword', ignore_above: 256 },
      },
    },
    description: { type: 'text', analyzer: 'standard' },
    tags: { type: 'keyword' },
    status: { type: 'keyword' },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
  },
};

/**
 * Default index settings.
 */
const DEFAULT_SETTINGS = {
  number_of_shards: 1,
  number_of_replicas: 1,
  analysis: {
    analyzer: {
      standard: {
        type: 'standard',
        stopwords: '_english_',
      },
    },
  },
};

/**
 * Creates an Elasticsearch index with the supplied (or default) mappings and settings.
 *
 * @param {string} index - Name of the index to create.
 * @param {object} [mappings] - Elasticsearch mappings object (merged with defaults).
 * @param {object} [settings] - Elasticsearch settings object (merged with defaults).
 * @returns {Promise<object>} Elasticsearch API response.
 */
async function createIndex(index, mappings = {}, settings = {}) {
  const client = getClient();

  const mergedMappings = {
    ...DEFAULT_MAPPINGS,
    ...mappings,
    properties: {
      ...DEFAULT_MAPPINGS.properties,
      ...(mappings.properties || {}),
    },
  };

  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };

  return client.indices.create({
    index,
    body: {
      mappings: mergedMappings,
      settings: mergedSettings,
    },
  });
}

/**
 * Deletes an Elasticsearch index.
 *
 * @param {string} index - Name of the index to delete.
 * @returns {Promise<object>} Elasticsearch API response.
 */
async function deleteIndex(index) {
  const client = getClient();
  return client.indices.delete({ index });
}

/**
 * Checks whether an index exists.
 *
 * @param {string} index - Name of the index.
 * @returns {Promise<boolean>}
 */
async function indexExists(index) {
  const client = getClient();
  const response = await client.indices.exists({ index });
  return response.statusCode === 200;
}

/**
 * Updates the mapping for an existing index.
 *
 * @param {string} index - Name of the index.
 * @param {object} properties - New or updated field properties.
 * @returns {Promise<object>} Elasticsearch API response.
 */
async function putMapping(index, properties) {
  const client = getClient();
  return client.indices.putMapping({
    index,
    body: { properties },
  });
}

/**
 * Retrieves the current mapping for an index.
 *
 * @param {string} index - Name of the index.
 * @returns {Promise<object>} Elasticsearch API response.
 */
async function getMapping(index) {
  const client = getClient();
  return client.indices.getMapping({ index });
}

// ---------------------------------------------------------------------------
// Document helpers
// ---------------------------------------------------------------------------

/**
 * Indexes (creates or replaces) a single document.
 *
 * @param {string} index - Target index name.
 * @param {string} id - Document ID.
 * @param {object} body - Document body.
 * @returns {Promise<object>} Elasticsearch API response.
 */
async function indexDocument(index, id, body) {
  const client = getClient();
  return client.index({ index, id, body, refresh: 'wait_for' });
}

/**
 * Retrieves a single document by ID.
 *
 * @param {string} index - Source index name.
 * @param {string} id - Document ID.
 * @returns {Promise<object|null>} The document source, or null if not found.
 */
async function getDocument(index, id) {
  const client = getClient();
  try {
    const response = await client.get({ index, id });
    return response.body._source;
  } catch (err) {
    if (err.meta && err.meta.statusCode === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Deletes a single document by ID.
 *
 * @param {string} index - Target index name.
 * @param {string} id - Document ID.
 * @returns {Promise<object>} Elasticsearch API response.
 */
async function deleteDocument(index, id) {
  const client = getClient();
  return client.delete({ index, id, refresh: 'wait_for' });
}

/**
 * Bulk indexes an array of documents.
 *
 * @param {string} index - Target index name.
 * @param {Array<{id: string, body: object}>} documents - Documents to index.
 * @returns {Promise<object>} Elasticsearch bulk API response.
 */
async function bulkIndex(index, documents) {
  const client = getClient();

  const body = documents.flatMap(({ id, body }) => [
    { index: { _index: index, _id: id } },
    body,
  ]);

  return client.bulk({ body, refresh: 'wait_for' });
}

// ---------------------------------------------------------------------------
// Query builders
// ---------------------------------------------------------------------------

/**
 * Builds a simple multi-match query.
 *
 * @param {string} queryText - The search text.
 * @param {string[]} fields - Fields to search across.
 * @param {object} [options]
 * @param {string} [options.type='best_fields'] - Multi-match type.
 * @param {number} [options.fuzziness=0] - Fuzziness level.
 * @returns {object} Elasticsearch query DSL object.
 */
function buildMultiMatchQuery(queryText, fields, options = {}) {
  const { type = 'best_fields', fuzziness = 0 } = options;

  return {
    query: {
      multi_match: {
        query: queryText,
        fields,
        type,
        fuzziness,
      },
    },
  };
}

/**
 * Builds a bool query from optional must / filter / should / must_not clauses.
 *
 * @param {object} [clauses]
 * @param {object|object[]} [clauses.must]
 * @param {object|object[]} [clauses.filter]
 * @param {object|object[]} [clauses.should]
 * @param {object|object[]} [clauses.mustNot]
 * @param {number} [clauses.minimumShouldMatch]
 * @returns {object} Elasticsearch query DSL object.
 */
function buildBoolQuery(clauses = {}) {
  const { must, filter, should, mustNot, minimumShouldMatch } = clauses;

  const bool = {};

  if (must) bool.must = must;
  if (filter) bool.filter = filter;
  if (should) bool.should = should;
  if (mustNot) bool.must_not = mustNot;
  if (minimumShouldMatch !== undefined) {
    bool.minimum_should_match = minimumShouldMatch;
  }

  return { query: { bool } };
}

/**
 * Builds a term (exact-match) filter.
 *
 * @param {string} field - Field name.
 * @param {string|number|boolean} value - Value to match.
 * @returns {object} Elasticsearch term DSL object.
 */
function buildTermFilter(field, value) {
  return { term: { [field]: value } };
}

/**
 * Builds a terms (multi-value exact-match) filter.
 *
 * @param {string} field - Field name.
 * @param {Array<string|number|boolean>} values - Values to match.
 * @returns {object} Elasticsearch terms DSL object.
 */
function buildTermsFilter(field, values) {
  return { terms: { [field]: values } };
}

/**
 * Builds a range filter.
 *
 * @param {string} field - Field name.
 * @param {object} [bounds]
 * @param {string|number} [bounds.gte] - Greater-than-or-equal bound.
 * @param {string|number} [bounds.lte] - Less-than-or-equal bound.
 * @param {string|number} [bounds.gt] - Greater-than bound.
 * @param {string|number} [bounds.lt] - Less-than bound.
 * @returns {object} Elasticsearch range DSL object.
 */
function buildRangeFilter(field, bounds = {}) {
  return { range: { [field]: bounds } };
}

/**
 * Builds an aggregation for a terms bucket (facet).
 *
 * @param {string} field - Field to aggregate on.
 * @param {number} [size=10] - Maximum number of buckets to return.
 * @returns {object} Elasticsearch aggregation DSL fragment.
 */
function buildTermsAggregation(field, size = 10) {
  return {
    terms: {
      field,
      size,
    },
  };
}

/**
 * Builds a paginated search request body.
 *
 * @param {object} query - Elasticsearch query DSL (the value of the `query` key).
 * @param {object} [options]
 * @param {number} [options.from=0] - Offset for pagination.
 * @param {number} [options.size=10] - Page size.
 * @param {Array<{field: string, order: 'asc'|'desc'}>} [options.sort] - Sort descriptors.
 * @param {object} [options.aggregations] - Aggregation definitions.
 * @param {string[]} [options.sourceIncludes] - Fields to include in _source.
 * @returns {object} Complete Elasticsearch request body.
 */
function buildSearchBody(query, options = {}) {
  const {
    from = 0,
    size = 10,
    sort = [],
    aggregations,
    sourceIncludes,
  } = options;

  const body = {
    query,
    from,
    size,
  };

  if (sort.length > 0) {
    body.sort = sort.map(({ field, order }) => ({ [field]: { order } }));
  }

  if (aggregations) {
    body.aggs = aggregations;
  }

  if (sourceIncludes && sourceIncludes.length > 0) {
    body._source = { includes: sourceIncludes };
  }

  return body;
}

// ---------------------------------------------------------------------------
// Search execution
// ---------------------------------------------------------------------------

/**
 * Executes a search against the given index.
 *
 * @param {string} index - Target index name.
 * @param {object} body - Elasticsearch request body (use buildSearchBody).
 * @returns {Promise<{
 *   total: number,
 *   hits: Array<{id: string, score: number, source: object}>,
 *   aggregations: object|undefined
 * }>} Normalised search result.
 */
async function search(index, body) {
  const client = getClient();
  const response = await client.search({ index, body });

  const rawHits = response.body.hits;
  const total =
    typeof rawHits.total === 'number'
      ? rawHits.total
      : rawHits.total.value;

  const hits = rawHits.hits.map((hit) => ({
    id: hit._id,
    score: hit._score,
    source: hit._source,
  }));

  return {
    total,
    hits,
    aggregations: response.body.aggregations,
  };
}

/**
 * Executes a count query against the given index.
 *
 * @param {string} index - Target index name.
 * @param {object} query - Elasticsearch query DSL object.
 * @returns {Promise<number>} Total matching document count.
 */
async function count(index, query) {
  const client = getClient();
  const response = await client.count({ index, body: { query } });
  return response.body.count;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  // Client
  getClient,

  // Index mapping helpers
  DEFAULT_MAPPINGS,
  DEFAULT_SETTINGS,
  createIndex,
  deleteIndex,
  indexExists,
  putMapping,
  getMapping,

  // Document helpers
  indexDocument,
  getDocument,
  deleteDocument,
  bulkIndex,

  // Query builders
  buildMultiMatchQuery,
  buildBoolQuery,
  buildTermFilter,
  buildTermsFilter,
  buildRangeFilter,
  buildTermsAggregation,
  buildSearchBody,

  // Search execution
  search,
  count,
};
