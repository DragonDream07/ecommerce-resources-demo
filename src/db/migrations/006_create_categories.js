/**
 * Migration: 006_create_categories
 * Creates the categories table with self-referencing parent_id.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table.string('name', 150).notNullable();
    table.string('slug', 200).notNullable().unique();
    table
      .integer('parent_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('categories')
      .onDelete('SET NULL');
    table.text('description').nullable();
    table.string('image_url', 500).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('sort_order').unsigned().notNullable().defaultTo(0);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('categories');
};
