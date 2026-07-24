const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

const INDEX = process.env.ELASTICSEARCH_INDEX || 'content';

/**
 * Perform a full-text search with optional faceted filters and pagination.
 *
 * @param {object} params
 * @param {string} params.query     - The search query string.
 * @param {object} params.filters   - Key/value pairs for facet filters.
 * @param {number} params.page      - 1-based page number.
 * @param {number} params.size      - Number of results per page.
 * @returns {Promise<object>}       - Hits, total count, and aggregations.
 */
async function search({ query, filters, page, size }) {
  const from = (page - 1) * size;

  const must = [];
  const filterClauses = [];

  if (query && query.trim().length > 0) {
    must.push({
      multi_match: {
        query,
        fields: ['title^3', 'description^2', 'content'],
        fuzziness: 'AUTO',
      },
    });
  } else {
    must.push({ match_all: {} });
  }

  if (filters && typeof filters === 'object') {
    Object.entries(filters).forEach(([field, value]) => {
      if (Array.isArray(value)) {
        filterClauses.push({ terms: { [field]: value } });
      } else {
        filterClauses.push({ term: { [field]: value } });
      }
    });
  }

  const esQuery = {
    index: INDEX,
    body: {
      from,
      size,
      query: {
        bool: {
          must,
          filter: filterClauses,
        },
      },
      aggs: {
        categories: {
          terms: { field: 'category.keyword', size: 20 },
        },
        tags: {
          terms: { field: 'tags.keyword', size: 50 },
        },
        authors: {
          terms: { field: 'author.keyword', size: 20 },
        },
      },
      highlight: {
        fields: {
          title: {},
          description: {},
          content: { fragment_size: 150, number_of_fragments: 3 },
        },
      },
    },
  };

  const { body } = await client.search(esQuery);

  const hits = body.hits.hits.map((hit) => ({
    id: hit._id,
    score: hit._score,
    source: hit._source,
    highlight: hit.highlight || {},
  }));

  const aggregations = {};
  if (body.aggregations) {
    Object.entries(body.aggregations).forEach(([aggName, aggValue]) => {
      aggregations[aggName] = (aggValue.buckets || []).map((bucket) => ({
        key: bucket.key,
        count: bucket.doc_count,
      }));
    });
  }

  return {
    total: body.hits.total.value,
    page,
    size,
    hits,
    aggregations,
  };
}

/**
 * Provide autocomplete suggestions for the given query prefix.
 *
 * @param {object} params
 * @param {string} params.query  - The query prefix.
 * @param {number} params.size   - Maximum number of suggestions to return.
 * @returns {Promise<object>}    - Array of suggestion strings.
 */
async function suggest({ query, size }) {
  const esQuery = {
    index: INDEX,
    body: {
      size: 0,
      suggest: {
        text: query,
        title_suggest: {
          completion: {
            field: 'title.suggest',
            size,
            skip_duplicates: true,
            fuzzy: {
              fuzziness: 'AUTO',
            },
          },
        },
      },
    },
  };

  const { body } = await client.search(esQuery);

  const suggestions = [];
  const titleSuggest = body.suggest && body.suggest.title_suggest;
  if (titleSuggest && titleSuggest.length > 0) {
    titleSuggest[0].options.forEach((option) => {
      suggestions.push({
        text: option.text,
        score: option._score,
      });
    });
  }

  return { suggestions };
}

module.exports = { search, suggest };
