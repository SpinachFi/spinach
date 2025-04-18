import { create } from "zustand";
import { DEFAULT_CHAIN } from "./consts";

interface SpiState {
  tallyFormId?: string;
  setTallyFormId: (formId?: string) => void;
  selectedChain: ChainName;
  setSelectedChain: (chain: ChainName) => void;
}

export const useSpiStore = create<SpiState>((set) => ({
  selectedChain: DEFAULT_CHAIN,
  setSelectedChain: (selectedChain: ChainName) =>
    set(() => ({ selectedChain })),
  tallyFormId: undefined,
  setTallyFormId: (tallyFormId?: string) => set(() => ({ tallyFormId })),
}));
