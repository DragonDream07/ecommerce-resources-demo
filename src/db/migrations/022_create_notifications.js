/**
 * Migration: 022_create_notifications
 * Creates the notifications table with FK to users (nullable for broadcast).
 */
exports.up = async function (knex) {
  await knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('type', 50).notNullable();
    table.string('channel', 20).notNullable().defaultTo('in_app');
    table.string('title', 255).notNullable();
    table.text('body').notNullable();
    table.jsonb('data').nullable();
    table.boolean('is_read').notNullable().defaultTo(false);
    table.boolean('is_broadcast').notNullable().defaultTo(false);
    table.timestamp('sent_at').nullable();
    table.timestamp('read_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('notifications');
};
