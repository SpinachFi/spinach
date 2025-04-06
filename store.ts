import { create } from "zustand";
import { DEFAULT_CHAIN } from "./consts";

interface SpiState {
  selectedChain: ChainName;
  setSelectedChain: (chain: ChainName) => void;
}

export const useSpiStore = create<SpiState>((set) => ({
  selectedChain: DEFAULT_CHAIN,
  setSelectedChain: (selectedChain: ChainName) =>
    set(() => ({ selectedChain })),
}));
