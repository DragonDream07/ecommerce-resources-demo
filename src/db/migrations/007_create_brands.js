/**
 * Migration: 007_create_brands
 * Creates the brands table.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('brands', (table) => {
    table.increments('id').primary();
    table.string('name', 150).notNullable().unique();
    table.string('slug', 200).notNullable().unique();
    table.text('description').nullable();
    table.string('logo_url', 500).nullable();
    table.string('website_url', 500).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('brands');
};
