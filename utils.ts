import { celo, optimism } from "viem/chains";

export const CHAIN_MAP: { [name: string]: number } = {
  celo: celo.id,
  superchain: optimism.id,
};
export const AVAILABLE_CHAINS = Object.keys(CHAIN_MAP);
export const DEFAULT_CHAIN = AVAILABLE_CHAINS[0];