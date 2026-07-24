/**
 * Migration: 015_create_order_items
 * Creates the order_items table with FK to orders and skus.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('order_items', (table) => {
    table.increments('id').primary();
    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');
    table
      .integer('sku_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('skus')
      .onDelete('RESTRICT');
    table.string('product_name', 255).notNullable();
    table.string('sku_code', 100).notNullable();
    table.string('size', 50).nullable();
    table.string('colour', 50).nullable();
    table.integer('quantity').unsigned().notNullable();
    table.decimal('unit_price', 12, 2).notNullable();
    table.decimal('total_price', 12, 2).notNullable();
    table.decimal('discount_amount', 12, 2).notNullable().defaultTo(0);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('order_items');
};
