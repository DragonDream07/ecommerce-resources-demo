/**
 * Migration: 021_create_order_tracking
 * Creates the order_tracking table with FK to orders.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('order_tracking', (table) => {
    table.increments('id').primary();
    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');
    table.string('courier_name', 100).nullable();
    table.string('tracking_number', 200).nullable();
    table.string('tracking_url', 500).nullable();
    table.string('status', 50).notNullable().defaultTo('processing');
    table.text('status_description').nullable();
    table.string('current_location', 255).nullable();
    table.timestamp('estimated_delivery_at').nullable();
    table.timestamp('delivered_at').nullable();
    table.jsonb('tracking_events').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('order_tracking');
};
