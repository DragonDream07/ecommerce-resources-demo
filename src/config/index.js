'use strict';

const dotenv = require('dotenv');
const Joi = require('joi');

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),

  // Database
  DB_CLIENT: Joi.string().default('pg'),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().integer().min(1).max(65535).default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_POOL_MIN: Joi.number().integer().min(0).default(2),
  DB_POOL_MAX: Joi.number().integer().min(1).default(10),

  // Elasticsearch
  ELASTICSEARCH_NODE: Joi.string().uri().default('http://localhost:9200'),
  ELASTICSEARCH_USERNAME: Joi.string().default(''),
  ELASTICSEARCH_PASSWORD: Joi.string().default(''),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_RESET_TTL: Joi.string().default('1h'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(60000),
  RATE_LIMIT_MAX: Joi.number().integer().min(1).default(100),
}).unknown(true);

const { error, value: env } = schema.validate(process.env);

if (error) {
  throw new Error(`Configuration validation error: ${error.message}`);
}

module.exports = {
  env: env.NODE_ENV,
  port: env.PORT,

  db: {
    client: env.DB_CLIENT,
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    pool: {
      min: env.DB_POOL_MIN,
      max: env.DB_POOL_MAX,
    },
  },

  elasticsearch: {
    node: env.ELASTICSEARCH_NODE,
    username: env.ELASTICSEARCH_USERNAME,
    password: env.ELASTICSEARCH_PASSWORD,
  },

  jwt: {
    secret: env.JWT_SECRET,
    accessTTL: env.JWT_ACCESS_TTL,
    resetTTL: env.JWT_RESET_TTL,
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },
};
