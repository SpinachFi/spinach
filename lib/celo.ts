import axios from "axios";
import { ethers } from "ethers";
import { cacheExchange, createClient, fetchExchange, gql } from "urql";
import { celo, Chain } from "viem/chains";

import { getChainRPCUrl, getGloContractAddress } from "./config";
import { getBalance } from "./utils";

export const getRefi = async () => {
  const contractAdr = "0x505E65f7D854d4a564b5486d59c91E1DfE627579";
  const balance = await getBalance(contractAdr, celo);

  const provider = new ethers.JsonRpcProvider(getChainRPCUrl(celo));
  const abi = [
    "function funds() view returns (uint256, uint256, uint256, uint256)",
  ];
  const lendingContract = new ethers.Contract(contractAdr, abi, provider);

  const res = await lendingContract.funds();
  const totalFunds = res[0];

  const scalar = BigInt(10 ** 3);
  // Checks the lending contract, review total deposited amount, and subtract current amount in the contract.
  const total = totalFunds / scalar - balance / BigInt(10 ** 18);

  return Number(total);
};

export const getUbeswap = async () => {
  const { data: ipfsData } = await axios.get(
    "https://api.ubeswap.org/api/ubeswap/farmv3/0x82774b5b1443759f20679a61497abf11115a4d0e2076caedf9d700a8c53f286f/ipfs-url"
  );

  const result = await axios.get(`${ipfsData.ipfsUrl}/metadata.json`);
  const totalShares = BigInt(result.data.totalShares);

  const {
    data: {
      result: { ethusd: celoPrice },
    },
  } = await axios.get(
    `https://api.celoscan.io/api?module=stats&action=ethprice&apikey=${process.env.CELOSCAN_API_KEY}`
  );

  const total = Number(totalShares / BigInt(10 ** 18)) * parseFloat(celoPrice);

  return Math.round(total);
};

type ResType = {
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

const UNISWAP_V3_SUBPGRAPH = `https://gateway.thegraph.com/api/${process.env.THEGRAPH_API_KEY}/subgraphs/id/ESdrTJ3twMwWVoQ1hUE2u7PugEHX3QkenudD6aXCkDQ4`;

export const getCeloUniswapLpTVL = async () =>
  getUniswapGraphData(UNISWAP_V3_SUBPGRAPH, celo);

export const getUniswapGraphData = async (url: string, chain: Chain) => {
  const client = createClient({
    url,
    exchanges: [cacheExchange, fetchExchange],
  });

  const gloToken = getGloContractAddress(chain).toLowerCase();

  const query = gql`
      query {
        pools(
          where: {
            or: [
              { token0: "${gloToken}" }
              { token1: "${gloToken}" }
            ]
          }
        ) {
          id
          totalValueLockedToken0
          totalValueLockedToken1
          token0 {
              id
              symbol
          }
          token1 {
              id
              symbol
          }
        }
      }
    `;

  const { data, error } = await client.query<ResType>(query, {}).toPromise();
  const pools = data?.pools;

  const details: { [symbol: string]: number } = {};

  if (!pools) {
    console.error(
      `Could not fetch data from Uniswap subgraph for ${chain.name}`
    );
    console.log(error);
    return { total: 0, details };
  }

  let total = 0;
  pools.forEach((pool) => {
    const [token0, token1] = [pool.token0, pool.token1];
    const [symbol, tvl] =
      token0.id === gloToken
        ? [token1.symbol, pool.totalValueLockedToken0]
        : [token0.symbol, pool.totalValueLockedToken1];
    if (!details[symbol]) {
      details[symbol] = 0;
    }
    const value = Math.round(parseFloat(tvl));
    details[symbol] += value;
    total += value;
  });

  return { total, details };
};

type DexType = {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
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

export const getDexData = async (
  chain: ChainName,
  dexId = "uniswap"
): Promise<Dict> => {
  const {
    data: { pairs },
  } = await axios.get<{ pairs: DexType[] }>(
    "https://api.dexscreener.com/latest/dex/search?q=usdglo"
  );

  return pairs
    .filter((pair) => pair.chainId === chain && pair.dexId === dexId)
    .reduce(
      (acc, cur) => ({
        ...acc,
        [cur.baseToken.symbol === "USDGLO"
          ? cur.quoteToken.symbol
          : cur.baseToken.symbol]: cur.liquidity?.usd,
      }),
      {}
    );
};
