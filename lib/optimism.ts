import { optimism } from "viem/chains";
import { getUniswapGraphData } from "./celo";
import axios from "axios";

const UNISWAP_V3_SUBPGRAPH = `https://gateway.thegraph.com/api/${process.env.THEGRAPH_API_KEY}/subgraphs/id/Cghf4LfVqPiFw6fp6Y5X5Ubc8UpmUhSfJL82zwiBFLaj`;

export const getOptimismUniswapLpTVL = async () =>
  getUniswapGraphData(UNISWAP_V3_SUBPGRAPH, optimism);

const COINGECKO_POOL_IDS = {
  GIV: "0x165e6dad9772c8cb44015edd5bd8b012a84bd276",
};

type PoolData = {
  data: {
    attributes: {
      name: string;
      reserve_in_usd: number;
    };
  };
};

export const getCoingeckoData = async () => {
  const network = "optimism";
  const { data } = await axios.get<PoolData>(
    `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${COINGECKO_POOL_IDS.GIV}`
  );

  return {
    GIV: Number(data.data.attributes.reserve_in_usd),
  };
};
