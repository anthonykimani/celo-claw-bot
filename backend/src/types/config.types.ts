export type DatabaseConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  sslMode?: string;
  channelBinding?: string;
};

export type RedisConfig = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls: boolean;
};

export type PolymarketConfig = {
  clobApiUrl: string;
  gammaApiUrl: string;
  walletPrivateKey?: string;
  funderAddress?: string;
  signatureType?: number;
  chainId?: number;
  enableRealTrading?: boolean;
  rpcUrl?: string;
  usdcAddress?: string;
  clobWebSocketUrl?: string;
  websocketEnabled?: boolean;
  websocketReconnectDelay?: number;
  websocketCustomFeaturesEnabled?: boolean;

  // Optional: provide CLOB API key creds directly (otherwise derived from wallet)
  clobApiKey?: string;
  clobApiSecret?: string;
  clobApiPassphrase?: string;
};

export type SchedulerConfig = {
  syncCron: string;
  priceUpdateCron: string;
};

export type CorsConfig = {
  origins: string[];
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
};

export type CeloConfig = {
  rpcUrl?: string;
  serverPrivateKey?: string;
  cusdTokenAddress?: string;
  reserveAddress?: string;
  erc8004RegistryAddress?: string;
};

export type AppConfig = {
  port: number;
  defaultProvider: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  polymarket: PolymarketConfig;
  celo: CeloConfig;
  scheduler: SchedulerConfig;
  cors: CorsConfig;
};
