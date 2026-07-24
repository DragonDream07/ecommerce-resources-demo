/**
 * Migration: 003_create_user_roles
 * Creates the user_roles join table.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('user_roles', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('role_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('roles')
      .onDelete('CASCADE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['user_id', 'role_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('user_roles');
};
