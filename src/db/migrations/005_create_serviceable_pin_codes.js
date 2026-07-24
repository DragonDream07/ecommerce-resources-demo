/**
 * Migration: 005_create_serviceable_pin_codes
 * Creates the serviceable_pin_codes lookup table.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('serviceable_pin_codes', (table) => {
    table.increments('id').primary();
    table.string('pin_code', 10).notNullable().unique();
    table.string('city', 100).nullable();
    table.string('state', 100).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('estimated_delivery_days').unsigned().nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('serviceable_pin_codes');
};
