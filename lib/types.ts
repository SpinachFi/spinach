// API Response Types
export type ResType = {
  pools: [
    {
      id: string;
      totalValueLockedToken0: string;
      totalValueLockedToken1: string;
      token0: {
        id: string;
        symbol: string;
      };
      token1: {
        id: string;
        symbol: string;
      };
    },
  ];
};

export type DexType = {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  priceUsd: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
};

export type OkuPoolData = {
  t0_symbol: string;
  t1_symbol: string;
  t0_tvl_usd: number;
  t1_tvl_usd: number;
  tvl_usd: number;
};

export type BlockScoutData = {
  items: {
    value: string;
    token: {
      address_hash: string;
      name: string;
      symbol: string;
      exchange_rate: string;
    };
  }[];
};

export type BitSaveTransaction = {
  amount: number;
  transaction_type: "deposit" | "withdrawal";
  currency: string;
  created_at: string;
};

// Uniblock API Types
export type UniblockToken = {
  symbol?: string;
  address?: string;
};

export type UniblockPoolAttributes = {
  reserve_in_usd?: string | number;
  base_token_reserve_in_usd?: string | number;
  quote_token_reserve_in_usd?: string | number;
};

export type UniblockRelationship = {
  data?: { id?: string } | null;
};

export type UniblockPoolResponse = {
  data?: {
    attributes?: UniblockPoolAttributes;
    relationships?: {
      base_token?: UniblockRelationship;
      quote_token?: UniblockRelationship;
    };
  };
  included?: Array<{
    type?: string;
    id?: string;
    attributes?: UniblockToken;
  }>;
};
