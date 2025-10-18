export interface TokenStats {
  priceChange: number;
  liquidityChange?: number;
  volumeChange?: number;
  buyVolume: number;
  sellVolume: number;
  buyOrganicVolume?: number;
  sellOrganicVolume?: number;
  numBuys: number;
  numSells: number;
  numTraders: number;
  numOrganicBuyers?: number;
  numNetBuyers: number;
  holderChange?: number;
}

export interface TokenAudit {
  mintAuthorityDisabled?: boolean;
  freezeAuthorityDisabled?: boolean;
  topHoldersPercentage: number;
  devBalancePercentage?: number;
  devMigrations?: number;
}

export interface TokenPool {
  id: string;
  createdAt: string;
}

export interface TokenApy {
  jupEarn: number;
}

export interface Token {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  twitter?: string;
  website?: string;
  dev?: string;
  circSupply: number;
  totalSupply: number;
  tokenProgram: string;
  mintAuthority?: string;
  freezeAuthority?: string;
  launchpad?: string;
  firstPool: TokenPool;
  graduatedPool?: string;
  graduatedAt?: string;
  holderCount: number;
  audit: TokenAudit;
  apy?: TokenApy;
  organicScore: number;
  organicScoreLabel: string;
  isVerified?: boolean;
  tags: string[];
  fdv: number;
  mcap: number;
  usdPrice: number;
  priceBlockId: number;
  liquidity: number;
  stats5m: TokenStats;
  stats1h: TokenStats;
  stats6h: TokenStats;
  stats24h: TokenStats;
  ctLikes?: number;
  smartCtLikes?: number;
  updatedAt: string;
}

export type TopTokensResponse = Token[];
