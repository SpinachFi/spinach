import axios from "axios";
import { ethers } from "ethers";
import { cacheExchange, createClient, fetchExchange, gql } from "urql";
import { celo, Chain } from "viem/chains";

import { getChainRPCUrl, getGloContractAddress } from "./config";
import { getBalance, twoDecimals } from "./utils";

export const getRefi = async (): Promise<PoolRecord> => {
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

  const tvl = twoDecimals(Number(total));
  return {
    token: "refi",
    tvl,
    incentiveTokenTvl: tvl,
    participatingTokenTvl: 0,
    dex: "uniswap",
  };
};

export const getUbeswap = async (farmAddress?: string): Promise<PoolRecord> => {
  const defaultFarm =
    "0x82774b5b1443759f20679a61497abf11115a4d0e2076caedf9d700a8c53f286f";
  const farmAddr = farmAddress || defaultFarm;

  let result;

  if (farmAddr.length === 66) {
    // Use IPFS endpoint for 32-byte incentive IDs
    const { data: ipfsData } = await axios.get(
      `https://api.ubeswap.org/api/ubeswap/farmv3/${farmAddr}/ipfs-url`
    );
    result = await axios.get(`${ipfsData.ipfsUrl}/metadata.json`);
  } else {
    // Use direct endpoint for 20-byte farm addresses
    result = await axios.get(
      `https://api.ubeswap.org/api/ubeswap/farmv3/${farmAddr}`
    );
  }
  const incentiveTokenTvl = BigInt(result.data.activeAmount0);

  // Handle different token pairs with different decimals
  let participatingTokenTvl;
  if (
    farmAddr ===
    "0x9fde166e7857f8b802dcd5da79a1362730c1d9c80771ba6000082f5d6aa6de42"
  ) {
    // axlREGEN/CELO farm - CELO has 18 decimals, no conversion needed
    participatingTokenTvl = BigInt(result.data.activeAmount1);
  } else {
    // USDC has 6 decimals, convert to 18
    participatingTokenTvl =
      BigInt(result.data.activeAmount1) * BigInt(10 ** 12);
  }

  const total = incentiveTokenTvl + participatingTokenTvl;

  const format = (value: bigint) =>
    twoDecimals(Number(value / BigInt(10 ** 18)));

  return {
    token: "ube",
    tvl: format(total),
    incentiveTokenTvl: format(incentiveTokenTvl),
    participatingTokenTvl: format(participatingTokenTvl),
    dex: "ubeswap",
  };
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
  priceUsd: string;
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
  poolsWhitelist: string[],
  dex: DexName = "uniswap"
): Promise<PoolRecord[]> => {
  const glo = getGloContractAddress(celo);
  const { data: pairs } = await axios.get<DexType[]>(
    `https://api.dexscreener.com/token-pairs/v1/${chain}/${glo}`
  );

  return pairs
    .filter(
      (pair) =>
        pair.dexId === dex &&
        poolsWhitelist.includes(pair.pairAddress.toLowerCase())
    )
    .map((pair) => {
      const isGloBase = pair.baseToken.symbol === "USDGLO";
      const priceUsd = parseFloat(pair.priceUsd);
      const [otherToken, baseTvl, quoteTvl] = isGloBase
        ? [pair.quoteToken.symbol, pair.liquidity.base, pair.liquidity.quote]
        : [pair.baseToken.symbol, pair.liquidity.quote, pair.liquidity.base];
      return {
        token: otherToken,
        tvl: Math.round(pair.liquidity?.usd),
        incentiveTokenTvl: Math.round(baseTvl),
        participatingTokenTvl: Math.round(quoteTvl * priceUsd),
        dex,
      };
    });
};

type OkuPoolData = {
  t0_symbol: string;
  t1_symbol: string;
  t0_tvl_usd: number;
  t1_tvl_usd: number;
  tvl_usd: number;
};

export const getOkuTradeData = async (
  poolId: string,
  chain: ChainName
): Promise<PoolRecord> => {
  const res = await axios.post<{ result: OkuPoolData }>(
    `https://omni.icarus.tools/${chain}/cush/analyticsPool`,
    { params: [poolId] }
  );
  const data = res.data.result;
  await getOkuTradesData(chain);

  const tvls = [data.t0_tvl_usd, data.t1_tvl_usd];
  const [incentiveTokenTvl, participatingTokenTvl] =
    data.t0_symbol === "USDGLO" ? tvls : tvls.reverse();

  return {
    token: "NATURE",
    tvl: twoDecimals(data.tvl_usd),
    incentiveTokenTvl,
    participatingTokenTvl,
    dex: "uniswap",
  };
};

export const getOkuTradesData = async (
  chain: ChainName
): Promise<PoolRecord[]> => {
  const res = await axios.post<{ result: { pools: OkuPoolData[] } }>(
    `https://omni.icarus.tools/${chain}/cush/searchPoolsByTokenNameOrSymbol`,
    {
      params: [
        "USDGLO",
        {
          result_size: 100,
          sort_by: "tvl_usd",
        },
      ],
    }
  );
  const data = res.data.result;

  const pools: PoolRecord[] = data.pools.map((pool) => {
    const isT0Glo = pool.t0_symbol === "USDGLO";
    const tvls = [pool.t0_tvl_usd, pool.t1_tvl_usd];
    const [incentiveTokenTvl, participatingTokenTvl] = isT0Glo
      ? tvls
      : tvls.reverse();
    const token = isT0Glo ? pool.t1_symbol : pool.t0_symbol;

    return {
      token,
      tvl: twoDecimals(pool.tvl_usd),
      incentiveTokenTvl,
      participatingTokenTvl,
      dex: "uniswap",
    };
  });

  return pools.reverse();
};

type BlockScoutData = {
  items: {
    value: string;
    token: {
      address_hash: string;
      name: string;
      symbol: string;
      exchange_rate: string;
    };
  }[];
};
export const getBlockScoutData = async (
  poolId: string,
  addresses: [string, string]
): Promise<PoolRecord[]> => {
  const res = await axios.get<BlockScoutData>(
    `https://celo.blockscout.com/api/v2/addresses/${poolId}/tokens?type=ERC-20`
  );

  const incentiveToken = res.data.items.find(
    (x) => x.token?.address_hash?.toLowerCase() === addresses[0].toLowerCase()
  );
  const participatingToken = res.data.items.find(
    (x) => x.token?.address_hash?.toLowerCase() === addresses[1].toLowerCase()
  );

  if (!incentiveToken || !participatingToken) {
    return [];
  }

  const format = (value: string, rate: string) =>
    twoDecimals(Number(BigInt(value) / BigInt(10 ** 18)) * Number(rate));
  const incentiveTokenTvl = format(
    incentiveToken.value,
    incentiveToken.token.exchange_rate
  );
  const participatingTokenTvl = format(
    participatingToken.value,
    participatingToken.token.exchange_rate
  );

  const token = participatingToken.token.symbol;
  return [
    {
      token: token === "G" ? "G$" : token,
      tvl: incentiveTokenTvl + participatingTokenTvl,
      incentiveTokenTvl,
      participatingTokenTvl,
      dex: "ubeswap",
    },
  ];
};

export const getGarden = async (
  token: string,
  poolAddress: string,
  dex: DexName = "garden"
): Promise<PoolRecord> => {
  const balance = await getBalance(poolAddress, celo);

  const tvl = twoDecimals(Number(balance / BigInt(10 ** 18)));
  return {
    token: token,
    tvl,
    incentiveTokenTvl: tvl,
    participatingTokenTvl: 0,
    dex,
  };
};

// WeightedPool 50USDGLO-50cUSD
// 0x13f3adc9683d6f83d592df7ad7178cfd672803ff (getPoolId, getVault)
// Vault
// https://celo.blockscout.com/address/0xeA280B39437a64473a0C77949759E6629eD1Dc73?tab=contract_abi
// Pool R-USDGLO-CUSD
// https://celo.blockscout.com/address/0xF7fEe07D4410AF146795021F01C54af179494cB5?tab=read_write_contract
export const getRefiPoolTokens = async (poolAddr: string): Promise<Dict> => {
  const provider = new ethers.JsonRpcProvider(getChainRPCUrl(celo));
  const abi = [
    "function getPoolTokens(bytes32 poolId) view returns (address[], uint256[], uint256)",
  ];
  const contract = new ethers.Contract(
    "0xeA280B39437a64473a0C77949759E6629eD1Dc73", // Vault address
    abi,
    provider
  );

  try {
    const result = await contract.getPoolTokens(poolAddr);
    const zipped = result[0].reduce(
      (acc: Dict, cur: string, index: number) => ({
        ...acc,
        [cur.toLowerCase()]: twoDecimals(
          Number(result[1][index] / BigInt(10 ** getDecimals(result[0][index])))
        ),
      }),
      {} as Dict
    );

    return zipped;
  } catch (err) {
    console.log(`Could not fetch getPoolTokens for Refi`);
    console.error(err);
    return {};
  }
};

const getDecimals = (tokenAddr: string) => {
  const decMap: Dict = {
    "0x4f604735c1cf31399c6e711d5962b2b3e0225ad3": 18, // GLO
    "0x765de816845861e75a25fca122bb6898b8b1282a": 18, // CUSD
    "0x2e6c05f1f7d1f4eb9a088bf12257f1647682b754": 6, // AXL
    "0xceba9300f2b948710d2653dd7b07f33a8b32118c": 6, // USDC
  };

  return decMap[tokenAddr.toLowerCase()] || 18;
};

export const getRegenerativeFi = async (config: {
  poolAddr: string;
  name: string;
  participatingToken: { addr: string; price?: number };
  incentiveToken: { addr: string; price?: number };
}): Promise<PoolRecord> => {
  const { poolAddr, name, incentiveToken, participatingToken } = config;
  const tokensMap = await getRefiPoolTokens(poolAddr);

  const main = twoDecimals(
    tokensMap[incentiveToken.addr.toLowerCase()] * (incentiveToken.price || 1)
  );
  const other = twoDecimals(
    tokensMap[participatingToken.addr.toLowerCase()] *
      (participatingToken.price || 1)
  );

  return {
    token: name,
    tvl: twoDecimals(other + main),
    incentiveTokenTvl: main,
    participatingTokenTvl: other,
    dex: "garden",
  };
};

export const fetchTokenPrices = async () => {
  const tokens: string[] = [
    "0x2E6C05f1f7D1f4Eb9A088bf12257f1647682b754", // AxlRegen
    "0x34fA24Edcf5099c6f7e9a89B557C5d766354598E", // Nature
    "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A", // G$
  ];
  const res = await axios.get<
    { baseToken: { address: string }; priceUsd: string }[]
  >(`https://api.dexscreener.com/tokens/v1/celo/${tokens.join(",")}`);

  const prices = res.data.reduce(
    (acc, cur) => {
      if (cur.baseToken?.address) {
        return {
          ...acc,
          [cur.baseToken.address.toLowerCase()]: parseFloat(cur.priceUsd),
        };
      }
      return acc;
    },
    {} as Record<string, number>
  );

  return prices;
};

export const getCeloPrice = async () => {
  const {
    data: {
      result: { ethusd: celoPrice },
    },
  } = await axios.get(
    `https://api.celoscan.io/api?module=stats&action=ethprice&apikey=${process.env.CELOSCAN_API_KEY}`
  );
  return parseFloat(celoPrice);
};

export const getTokenPrice = (
  tokenAddress: string,
  tokenPrices: Record<string, number>
) => {
  return tokenPrices[tokenAddress.toLowerCase()] || 0;
};

type BitSaveTransaction = {
  amount: number;
  transaction_type: "deposit" | "withdrawal";
  currency: string;
  created_at: string;
};

export const getBitSave = async (): Promise<PoolRecord> => {
  const MAX_VALID_TX_AMOUNT = 1_000_000; // filter out wrong api values

  try {
    const { data } = await axios.get<BitSaveTransaction[]>(
      "https://bitsaveapi.vercel.app/transactions/currency/usdglo"
    );

    const { deposits, withdrawals } = data.reduce(
      (acc, tx) => {
        if (tx.currency.toUpperCase() !== "USDGLO") return acc;
        if (tx.amount > MAX_VALID_TX_AMOUNT) return acc; // skip large tx

        if (tx.transaction_type === "deposit") acc.deposits += tx.amount;
        if (tx.transaction_type === "withdrawal") acc.withdrawals += tx.amount;

        return acc;
      },
      { deposits: 0, withdrawals: 0 }
    );

    const netTvl = Math.max(0, deposits - withdrawals);
    const formattedNetTvl = twoDecimals(netTvl);

    return {
      token: "USDGLO",
      tvl: formattedNetTvl,
      incentiveTokenTvl: formattedNetTvl,
      participatingTokenTvl: 0,
      dex: "bitsave",
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching BitSave USDGLO data:", error.message);
    } else {
      console.error("Error fetching BitSave USDGLO data:", String(error));
    }
    return {
      token: "USDGLO",
      tvl: 0,
      incentiveTokenTvl: 0,
      participatingTokenTvl: 0,
      dex: "bitsave",
    };
  }
};
