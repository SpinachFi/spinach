import { optimism } from "viem/chains";
import { getUniswapGraphData } from "./celo";

const UNISWAP_V3_SUBPGRAPH = `https://gateway.thegraph.com/api/${process.env.THEGRAPH_API_KEY}/subgraphs/id/Cghf4LfVqPiFw6fp6Y5X5Ubc8UpmUhSfJL82zwiBFLaj`;

export const getOptimismUniswapLpTVL = async () =>
  getUniswapGraphData(UNISWAP_V3_SUBPGRAPH, optimism);
