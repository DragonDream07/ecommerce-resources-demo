/**
 * Seed: Sample Brands
 * Inserts a set of sample brands.
 */
exports.seed = async function (knex) {
  await knex('brands').del();

  await knex('brands').insert([
    {
      id: 1,
      name: 'TechNova',
      slug: 'technova',
      description: 'Cutting-edge consumer electronics and gadgets',
      website_url: 'https://technova.example.com',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 2,
      name: 'UrbanThread',
      slug: 'urbanthread',
      description: 'Modern urban fashion and streetwear',
      website_url: 'https://urbanthread.example.com',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 3,
      name: 'HomeHaven',
      slug: 'homehaven',
      description: 'Quality home furnishings and decor',
      website_url: 'https://homehaven.example.com',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 4,
      name: 'PeakGear',
      slug: 'peakgear',
      description: 'High-performance sports and outdoor equipment',
      website_url: 'https://peakgear.example.com',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 5,
      name: 'SoundWave',
      slug: 'soundwave',
      description: 'Premium audio equipment and accessories',
      website_url: 'https://soundwave.example.com',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 6,
      name: 'GreenRoot',
      slug: 'greenroot',
      description: 'Eco-friendly garden and outdoor products',
      website_url: 'https://greenroot.example.com',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);
};
