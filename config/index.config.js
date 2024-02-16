require("dotenv").config();
const os = require("os");
const pjson = require("../package.json");
const utils = require("../libs/utils");
const SERVICE_NAME = process.env.SERVICE_NAME
  ? utils.slugify(process.env.SERVICE_NAME)
  : pjson.name;
const AUTH_PORT = process.env.AUTH_PORT || 5111;
const STUDENT_PORT = process.env.STUDENT_PORT || 5112;
const CLASSROOM_PORT = process.env.CLASSROOM_PORT || 5113;
const SCHOOL_PORT = process.env.SCHOOL_PORT || 5114;
const API_DOCS_PORT = process.env.API_DOCS_PORT || 5115;
const ENV = process.env.ENV || "development";
const REDIS_URI = process.env.REDIS_URI || "redis://127.0.0.1:6379";

const CORTEX_REDIS = process.env.CORTEX_REDIS || REDIS_URI;
const CORTEX_PREFIX = process.env.CORTEX_PREFIX || "none";
const CORTEX_TYPE = process.env.CORTEX_TYPE || SERVICE_NAME;
const OYSTER_REDIS = process.env.OYSTER_REDIS || REDIS_URI;
const OYSTER_PREFIX = process.env.OYSTER_PREFIX || "none";

const CACHE_REDIS = process.env.CACHE_REDIS || REDIS_URI;
const CACHE_PREFIX = process.env.CACHE_PREFIX || `${SERVICE_NAME}:ch`;

const MONGO_URI =
  process.env.MONGO_URI || `mongodb://localhost:27017/${SERVICE_NAME}`;
const config = require(`./envs/${ENV}.js`);
const LONG_TOKEN_SECRET = process.env.LONG_TOKEN_SECRET || null;
const SHORT_TOKEN_SECRET = process.env.SHORT_TOKEN_SECRET || null;
const NACL_SECRET = process.env.NACL_SECRET || null;

if (!LONG_TOKEN_SECRET || !SHORT_TOKEN_SECRET || !NACL_SECRET) {
  throw Error("missing .env variables check index.config");
}

config.dotEnv = {
  SERVICE_NAME,
  ENV,
  CORTEX_REDIS,
  CORTEX_PREFIX,
  CORTEX_TYPE,
  OYSTER_REDIS,
  OYSTER_PREFIX,
  CACHE_REDIS,
  CACHE_PREFIX,
  MONGO_URI,
  AUTH_PORT,
  STUDENT_PORT,
  CLASSROOM_PORT,
  SCHOOL_PORT,
  API_DOCS_PORT,
  LONG_TOKEN_SECRET,
  SHORT_TOKEN_SECRET,
};

module.exports = config;
