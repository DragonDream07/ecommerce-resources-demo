/**
 * Migration: 014_create_orders
 * Creates the orders table with FK to users (nullable) and addresses.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table.string('order_number', 50).notNullable().unique();
    table
      .integer('user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table
      .integer('shipping_address_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('addresses')
      .onDelete('RESTRICT');
    table.string('status', 30).notNullable().defaultTo('pending');
    table.string('payment_status', 30).notNullable().defaultTo('unpaid');
    table.string('payment_method', 50).nullable();
    table.decimal('subtotal', 12, 2).notNullable();
    table.decimal('shipping_charge', 12, 2).notNullable().defaultTo(0);
    table.decimal('discount_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('tax_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('total_amount', 12, 2).notNullable();
    table
      .integer('promo_code_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('promo_codes')
      .onDelete('SET NULL');
    table.text('customer_notes').nullable();
    table.string('session_id', 255).nullable();
    table.timestamp('placed_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('orders');
};
