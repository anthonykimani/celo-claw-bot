export type PublicAgentTokenDto = {
  // For hackathon: no token; we keep this for UI parity.
  address: string | null;
  symbol: string | null;
  priceUsd: number | null;
  priceChange24h: number | null;
  marketCap: number | null;
  volume24h: number | null;
};

export type PublicAgentDto = {
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
  token: PublicAgentTokenDto;
  createdAt: number;
};
