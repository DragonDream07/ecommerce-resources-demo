/**
 * Migration: 008_create_products
 * Creates the products table with FK to categories and brands.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('slug', 300).notNullable().unique();
    table.text('description').nullable();
    table.text('short_description').nullable();
    table
      .integer('category_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('categories')
      .onDelete('RESTRICT');
    table
      .integer('brand_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('brands')
      .onDelete('SET NULL');
    table.decimal('base_price', 12, 2).notNullable();
    table.decimal('selling_price', 12, 2).notNullable();
    table.decimal('discount_percent', 5, 2).notNullable().defaultTo(0);
    table.string('status', 20).notNullable().defaultTo('active');
    table.boolean('is_featured').notNullable().defaultTo(false);
    table.jsonb('tags').nullable();
    table.jsonb('attributes').nullable();
    table.string('meta_title', 255).nullable();
    table.text('meta_description').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('products');
};
