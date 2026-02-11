export interface PaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
}

export interface Event {
  id: number;
  externalId: string;
  title: string;
  description?: any;
  slug?: any;
  image?: string | null;
  startDate?: any;
  endDate?: any;
  active: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  marketCount?: number;
  markets?: any[];
}

export interface EventListResponse {
  data: Event[];
  meta: PaginationMeta;
}

export interface Market {
  id: number;
  externalId: string;
  conditionId?: any;
  eventId: number;
  question: string;
  description?: any;
  image?: string | null;
  outcomeYesPrice: string;
  outcomeNoPrice: string;
  volume?: any;
  liquidity?: any;
  active: boolean;
  closed: boolean;
  createdAt: string;
  updatedAt: string;
  tokens?: Token[];
  eventTitle?: string;
  event?: any;
}

export interface Token {
  id: number;
  tokenId: string;
  outcome: 'YES' | 'NO';
  price: string;
}

export interface MarketListResponse {
  data: Market[];
  meta: PaginationMeta;
}

export interface CreateOrderDto {
  marketId: number;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  outcome: 'YES' | 'NO';
  amount?: string;
  quantity?: string;
  price?: string;
  metadata?: any;
  walletAddress?: string;
  signature?: string;
  nonce?: string;
}

export interface Order {
  id: number;
  idempotencyKey: string;
  marketId: number;
  marketTitle?: string | null;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  outcome: 'YES' | 'NO';
  quantity: string;
  price?: any;
  status: 'PENDING' | 'QUEUED' | 'PROCESSING' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'FAILED';
  filledQuantity: string;
  averageFillPrice?: any;
  externalOrderId?: any;
  failureReason?: any;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  data: Order[];
  meta: PaginationMeta;
}

export interface SyncResponse {
  jobId: string;
  message: string;
}

export interface AgentTokenSummary {
  address: string | null;
  symbol: string;
  priceUsd: number | null;
  priceChange24h: number | null;
  marketCap: number | null;
  volume24h: number | null;
}

export interface AgentPublic {
  id: string;
  name: string;
  imageUrl: string | null;
  twitterHandle: string | null;
  strategy: string;
  personality: string | null;
  tradingEnabled: 0 | 1;
  balance: number;
  totalPnL: number;
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  token: AgentTokenSummary;
  createdAt: number;
}

export interface AgentsListResponse {
  success: boolean;
  data: AgentPublic[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface CreateAgentDto {
  name: string;
  strategyType?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  personality?: string;
  tradingEnabled?: boolean;
  reserveAddress?: string;
}

export interface Agent {
  id: string;
  name: string;
  strategyType: string;
  riskLevel: 'low' | 'medium' | 'high';
  personality: string | null;
  tradingEnabled: boolean;
  lastTradingBalanceUsdc: string;
  totalPnlUsdc: string;
  totalTrades: number;
  winningTrades: number;
  winRate: string;
  reserveAddress: string | null;
  erc8004AgentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentResponse {
  success: boolean;
  data: Agent;
}

export interface AgentResponse {
  success: boolean;
  data: Agent;
}

export interface ReserveEvent {
  id: number;
  agentId: string;
  amountCusd: number;
  txHash: string | null;
  note: string | null;
  createdAt: number;
}

export interface ReserveEventsResponse {
  success: boolean;
  data: ReserveEvent[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
