import { arbitrum, celo, Chain, optimism } from "viem/chains";

const stellarChain: Chain = {
  id: 999,
  name: "Stellar",
  nativeCurrency: { name: "Lumen", symbol: "XLM", decimals: 7 },
  rpcUrls: {
    default: { http: ["https://horizon.stellar.org"] },
    public: { http: ["https://horizon.stellar.org"] },
  },
  blockExplorers: {
    default: { name: "Stellar Expert", url: "https://stellar.expert/explorer/public" },
  },
} as const;

export const CHAIN_MAP: { [name in ChainName]: Chain } = {
  celo: celo,
  optimism: optimism,
  stellar: stellarChain,
  arbitrum: arbitrum,
};

export const getChainNameById = (chainId: number): ChainName => {
  for (const [name, chain] of Object.entries(CHAIN_MAP)) {
    if (chain.id === chainId) {
      return name as ChainName;
    }
  }

  throw new Error(`Chain ID ${chainId} not found in CHAIN_MAP`);
};

export const AVAILABLE_CHAINS: ChainName[] = Object.keys(
  CHAIN_MAP
) as ChainName[];
export const DEFAULT_CHAIN = AVAILABLE_CHAINS[0];

export const TALLY = {
  CELO: "w4OBx5",
  CREATE_COMPETITION: "w7EbWa",
  CASE_STUDIES: "3jEVqR",
  HOW_IT_WORKS: "woxNMe",
  REGEN: "woNzrV",
  STELLAR: "wzBbx1",
  GOODDOLLAR: "mVKWlj",
  ARBITRUM: "nGMoAZ",
};

export const TALLY_MAP: SDict = {
  usdglo5: "celo-usdglo",
  regen4: "regen",
  stellar: "stellar",
  gooddollar2: "gooddollar",
  arbitrum: "arbitrum",
};
