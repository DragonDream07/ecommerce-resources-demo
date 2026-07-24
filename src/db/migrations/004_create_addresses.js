/**
 * Migration: 004_create_addresses
 * Creates the addresses table with FK to users.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('addresses', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('full_name', 200).notNullable();
    table.string('phone', 20).notNullable();
    table.string('line1', 255).notNullable();
    table.string('line2', 255).nullable();
    table.string('city', 100).notNullable();
    table.string('state', 100).notNullable();
    table.string('country', 100).notNullable().defaultTo('India');
    table.string('pin_code', 10).notNullable();
    table.string('address_type', 20).notNullable().defaultTo('home');
    table.boolean('is_default').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('addresses');
};
