/**
 * Migration: 012_create_carts
 * Creates the carts table (nullable user_id for guest, session_id).
 */
exports.up = async function (knex) {
  await knex.schema.createTable('carts', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.string('session_id', 255).nullable();
    table
      .integer('promo_code_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('promo_codes')
      .onDelete('SET NULL');
    table.decimal('discount_amount', 12, 2).notNullable().defaultTo(0);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['user_id']);
    table.index(['session_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('carts');
};
