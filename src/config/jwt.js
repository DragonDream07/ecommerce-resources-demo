'use strict';

const config = require('./index');

const JWT_SECRET = config.jwt.secret;
const JWT_ACCESS_TTL = config.jwt.accessTTL;
const JWT_RESET_TTL = config.jwt.resetTTL;

module.exports = {
  JWT_SECRET,
  JWT_ACCESS_TTL,
  JWT_RESET_TTL,
};
