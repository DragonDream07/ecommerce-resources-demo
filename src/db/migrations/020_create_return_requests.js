/**
 * Migration: 020_create_return_requests
 * Creates the return_requests table with FK to orders.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('return_requests', (table) => {
    table.increments('id').primary();
    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('RESTRICT');
    table
      .integer('order_item_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('order_items')
      .onDelete('SET NULL');
    table.string('reason', 255).notNullable();
    table.text('description').nullable();
    table.string('status', 30).notNullable().defaultTo('pending');
    table.string('return_type', 20).notNullable().defaultTo('refund');
    table.jsonb('images').nullable();
    table.text('admin_notes').nullable();
    table.timestamp('resolved_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('return_requests');
};
