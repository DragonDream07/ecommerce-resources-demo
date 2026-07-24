/**
 * Seed: Default Admin User
 * Inserts a default admin user for development purposes.
 * Password: Admin1234! (bcrypt hash below)
 */
const bcrypt = require('bcrypt');

exports.seed = async function (knex) {
  await knex('users').where({ email: 'admin@example.com' }).del();

  const passwordHash = await bcrypt.hash('Admin1234!', 12);

  const [userId] = await knex('users')
    .insert([
      {
        id: 1,
        email: 'admin@example.com',
        password_hash: passwordHash,
        first_name: 'System',
        last_name: 'Administrator',
        is_active: true,
        email_verified: true,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      },
    ])
    .returning('id');

  const resolvedUserId = typeof userId === 'object' ? userId.id : userId;

  await knex('user_roles')
    .where({ user_id: resolvedUserId })
    .del();

  await knex('user_roles').insert([
    {
      user_id: resolvedUserId,
      role_id: 3, // admin
      created_at: knex.fn.now(),
    },
  ]);
};
