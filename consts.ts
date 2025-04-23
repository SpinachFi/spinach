import { celo, optimism } from "viem/chains";

export const CHAIN_MAP: { [name in ChainName]: number } = {
  celo: celo.id,
  optimism: optimism.id,
};

export const getChainNameById = (chainId: number): ChainName => {
  for (const [name, id] of Object.entries(CHAIN_MAP)) {
    if (id === chainId) {
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
};
