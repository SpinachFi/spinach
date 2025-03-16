import {
  arbitrum,
  base,
  celo,
  Chain,
  mainnet,
  optimism,
  polygon,
  vechain,
} from "viem/chains";

const chainConfig: { [id: number]: `0x${string}` } = {
  [polygon.id]: "0x4F604735c1cF31399C6E711D5962b2B3E0225AD3",
  [mainnet.id]: "0x4F604735c1cF31399C6E711D5962b2B3E0225AD3",
  [celo.id]: "0x4F604735c1cF31399C6E711D5962b2B3E0225AD3",
  [optimism.id]: "0x4F604735c1cF31399C6E711D5962b2B3E0225AD3",
  [base.id]: "0x4F604735c1cF31399C6E711D5962b2B3E0225AD3",
  [arbitrum.id]: "0x4F604735c1cF31399C6E711D5962b2B3E0225AD3",
  [vechain.id]: "0x29c630cce4ddb23900f5fe66ab55e488c15b9f5e",
};

const chainRPCUrl: { [chainId: number]: string } = {
  [celo.id]: process.env.NEXT_PUBLIC_CELO_RPC_URL!,
};

export const getChainRPCUrl = (chain: Chain): string => {
  return chainRPCUrl[chain.id];
};

export const getGloContractAddress = (chain: Chain): `0x${string}` =>
  chainConfig[chain.id];
