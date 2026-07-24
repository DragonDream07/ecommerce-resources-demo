/**
 * Migration: 002_create_users
 * Creates the users table with bcrypt password_hash column.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('phone', 20).nullable().unique();
    table.string('password_hash', 255).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.boolean('is_email_verified').notNullable().defaultTo(false);
    table.boolean('is_phone_verified').notNullable().defaultTo(false);
    table.timestamp('last_login_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('users');
};
