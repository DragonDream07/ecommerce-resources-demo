/**
 * Seed: Default Roles
 * Inserts customer, staff, and admin roles.
 */
exports.seed = async function (knex) {
  await knex('roles').del();

  await knex('roles').insert([
    {
      id: 1,
      name: 'customer',
      description: 'Regular customer with access to shopping features',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 2,
      name: 'staff',
      description: 'Staff member with limited administrative access',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 3,
      name: 'admin',
      description: 'Administrator with full system access',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);
};
