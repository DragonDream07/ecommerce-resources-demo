/**
 * Migration: 019_create_refunds
 * Creates the refunds table with FK to orders and payment_attempts.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('refunds', (table) => {
    table.increments('id').primary();
    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('RESTRICT');
    table
      .integer('payment_attempt_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('payment_attempts')
      .onDelete('SET NULL');
    table.decimal('amount', 12, 2).notNullable();
    table.string('status', 30).notNullable().defaultTo('pending');
    table.string('gateway_refund_id', 255).nullable();
    table.text('reason').nullable();
    table.jsonb('gateway_response').nullable();
    table.timestamp('processed_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('refunds');
};
