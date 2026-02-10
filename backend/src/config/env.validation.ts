import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USERNAME: Joi.string().default('postgres'),
  DATABASE_PASSWORD: Joi.string().default('postgres'),
  DATABASE_NAME: Joi.string().default('polymarket_trader'),
  DATABASE_SSL: Joi.string().valid('true', 'false').default('false'),
  PGSSLMODE: Joi.string().optional().allow(''),
  PGCHANNELBINDING: Joi.string().optional().allow(''),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_USERNAME: Joi.string().optional(),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_TLS: Joi.string().valid('true', 'false').default('false'),

  POLYMARKET_CLOB_API_URL: Joi.string().uri().default('https://clob.polymarket.com'),
  POLYMARKET_GAMMA_API_URL: Joi.string().uri().default('https://gamma-api.polymarket.com'),
  POLYMARKET_WALLET_PRIVATE_KEY: Joi.string().optional().allow(''),
  POLYMARKET_FUNDER_ADDRESS: Joi.string().optional().allow(''),
  POLYMARKET_SIGNATURE_TYPE: Joi.number().default(1),
  POLYMARKET_CHAIN_ID: Joi.number().default(137),
  POLYMARKET_ENABLE_REAL_TRADING: Joi.string().valid('true', 'false').default('false'),
  POLYMARKET_RPC_URL: Joi.string().uri().optional().allow(''),
  POLYMARKET_USDC_ADDRESS: Joi.string().optional().allow(''),
  POLYMARKET_CLOB_WEBSOCKET_URL: Joi.string().uri().default('wss://ws-subscriptions-clob.polymarket.com'),

  // Optional: provide CLOB API key creds directly (otherwise derived from wallet)
  POLYMARKET_CLOB_API_KEY: Joi.string().optional().allow(''),
  POLYMARKET_CLOB_API_SECRET: Joi.string().optional().allow(''),
  POLYMARKET_CLOB_API_PASSPHRASE: Joi.string().optional().allow(''),
  POLYMARKET_WEBSOCKET_ENABLED: Joi.string().valid('true', 'false').default('true'),
  POLYMARKET_WEBSOCKET_RECONNECT_DELAY: Joi.number().default(5000),
  POLYMARKET_WEBSOCKET_CUSTOM_FEATURES: Joi.string().valid('true', 'false').default('false'),

  SYNC_CRON_EXPRESSION: Joi.string().default('*/15 * * * *'),
  PRICE_UPDATE_CRON_EXPRESSION: Joi.string().default('*/5 * * * *'),

  CORS_ORIGINS: Joi.string().optional(),

  // Celo (reserve + ERC-8004)
  CELO_RPC_URL: Joi.string().uri().optional().allow(''),
  CELO_SERVER_PRIVATE_KEY: Joi.string().optional().allow(''),
  CELO_CUSD_TOKEN_ADDRESS: Joi.string().optional().allow(''),
  CELO_RESERVE_ADDRESS: Joi.string().optional().allow(''),
  CELO_ERC8004_REGISTRY_ADDRESS: Joi.string().optional().allow(''),

  DEFAULT_PROVIDER: Joi.string().default('polymarket'),
});
