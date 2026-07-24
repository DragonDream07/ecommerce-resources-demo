const db = require('../knex');

const TABLE = 'categories';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findBySlug = (slug) =>
  db(TABLE).where({ slug }).first();

const findAll = () =>
  db(TABLE).select('*').orderBy('sort_order', 'asc');

const findRootCategories = () =>
  db(TABLE).whereNull('parent_id').orderBy('sort_order', 'asc');

const findChildren = (parentId) =>
  db(TABLE).where({ parent_id: parentId }).orderBy('sort_order', 'asc');

const create = (data) =>
  db(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateById = (id, data) =>
  db(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

/**
 * Returns the category and all its ancestors (breadcrumb path).
 * Traverses up the tree iteratively.
 */
const getAncestors = async (id) => {
  const ancestors = [];
  let current = await findById(id);
  while (current && current.parent_id) {
    current = await findById(current.parent_id);
    if (current) ancestors.unshift(current);
  }
  return ancestors;
};

/**
 * Returns all descendant category IDs (inclusive of the given id).
 * Useful for filtering products by category tree.
 */
const getDescendantIds = async (id) => {
  const ids = [id];
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.shift();
    const children = await findChildren(current);
    for (const child of children) {
      ids.push(child.id);
      queue.push(child.id);
    }
  }
  return ids;
};

/**
 * Returns full category tree starting from root (or a given parentId).
 */
const getTree = async (parentId = null) => {
  const nodes = parentId
    ? await findChildren(parentId)
    : await findRootCategories();
  const tree = [];
  for (const node of nodes) {
    const children = await getTree(node.id);
    tree.push({ ...node, children });
  }
  return tree;
};

module.exports = {
  findById,
  findBySlug,
  findAll,
  findRootCategories,
  findChildren,
  create,
  updateById,
  deleteById,
  getAncestors,
  getDescendantIds,
  getTree,
};
