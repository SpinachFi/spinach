import { create } from 'zustand'
import { DEFAULT_CHAIN } from './utils'

interface SpiState {
    selectedChain: string
    setSelectedChain: (chain:string) => void
  }

export const useSpiStore = create<SpiState>((set) => ({
  selectedChain: DEFAULT_CHAIN,
  setSelectedChain: (selectedChain:string) => set(() => ({ selectedChain })),
}))