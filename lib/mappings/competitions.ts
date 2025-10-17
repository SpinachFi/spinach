"use server";

import {
  fetchTokenPrices,
  getBitSave,
  getBlockScoutData,
  getCeloPrice,
  getDexData,
  getGarden,
  getRefi,
  getRegenerativeFi,
  getTokenPrice,
  getUbeswap,
  getUniblockPoolData,
} from "@/lib/celo";
import { getGloContractAddress } from "@/lib/config";
import { arbitrum, celo } from "viem/chains";

export const getPoolDataFunc = (slug: string) => {
  const dataMap: { [key: string]: () => Promise<PoolRecord[]> } = {
    usdglo: getUsdglo,
    usdglo2: getUsdglo,
    usdglo3: getUsdglo,
    usdglo4: getUsdglo,
    usdglo5: getUsdglo,
    regen: getRegen,
    regen2: getRegen,
    regen3: getRegen,
    regen4: getRegen,
    gooddollar: getGoodDollar,
    gooddollar2: getGoodDollar,
    arbitrum: getArbitrum,
  };

  return dataMap[slug];
};

const getUsdglo = async () => {
  const tokenPrices = await fetchTokenPrices();

  // Data collection for the competition
  const UNISWAP_POOLS = [
    "0x0dbb0769b00d01d241ba4f7b2891fb5c2a975d51", // G$
    "0x4eb0685f69f0b87da744e159576556b709a74c09", // NATURE
    "0xeaaeabc83df22075d87bff0ae62f9496ffc808f3", // Axlregen
  ];
  const dex = await getDexData("celo", UNISWAP_POOLS);
  const ubeGoodDollar = await getBlockScoutData(
    "0x3d9e27c04076288ebfdc4815b4f6d81b0ed1b341",
    [getGloContractAddress(celo), "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A"]
  );

  const ube = await getUbeswap();
  const refi = await getRefi();
  const kokonut = await getGarden(
    "Kokonut",
    "0x432952e34729f92B08443A573b8A9CD60557Cea7"
  );
  const agroforest = await getGarden(
    "AgroforestDAO",
    "0xd251c52c091c54a14e00ad1a31a4cffb9e6c8197"
  );
  const web3i = await getGarden(
    "Web3Institute",
    "0xf3d67757c2a3b68c090572962113d7e5db530425"
  );

  const refidao = await getGarden(
    "ReFiDAO",
    "0x0f52002482c3188575f2e751dc948ab2fdd39d10",
    "Network Initiatives"
  );
  const refidao2 = await getGarden(
    "ReFiDAO",
    "0xcb857f1f2e36e0ee393125efa39802ece6363f80",
    "Node Kickstarter"
  );
  const cmcsg = await getGarden(
    "CMCSG",
    "0xa6a408914dc6e1ac9a8db8ce472923374b1b6beb"
  );

  const regfi = await getRegenerativeFi({
    poolAddr:
      "0xf7fee07d4410af146795021f01c54af179494cb500000000000000000000000c",
    name: "regenerative.fi",
    participatingToken: {
      addr: "0x765DE816845861e75A25fCA122bb6898B8B1282a", // CUSD
    },
    incentiveToken: { addr: getGloContractAddress(celo) },
  });
  const regfi3 = await getRegenerativeFi({
    poolAddr:
      "0xabe482b6e7e1a8dc87b81eea4d9de8f183bc785a000200000000000000000011",
    name: "USDT",
    participatingToken: {
      addr: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", // USDT
    },
    incentiveToken: { addr: getGloContractAddress(celo) },
  });
  const regfi2 = await getRegenerativeFi({
    poolAddr:
      "0xefe83dde81e4494768e9196d3bf1d68b4fb49fa300020000000000000000000d",
    name: "axlREGEN",
    participatingToken: {
      addr: "0x2e6c05f1f7d1f4eb9a088bf12257f1647682b754", // AxlRegen
      price: getTokenPrice(
        "0x2e6c05f1f7d1f4eb9a088bf12257f1647682b754",
        tokenPrices
      ),
    },
    incentiveToken: { addr: getGloContractAddress(celo) },
  });

  const getCarbonDeFi = async (): Promise<PoolRecord[]> => {
    const carbonData = await getBlockScoutData(
      "0x6619871118D144c1c28eC3b23036FC1f0829ed3a",
      [
        getGloContractAddress(celo),
        "0x471ece3750da237f93b8e339c536989b8978a438",
      ]
    );

    return carbonData.map((pool) => ({
      token: "Carbon DeFi",
      tvl: pool.incentiveTokenTvl ?? 0,
      incentiveTokenTvl: pool.incentiveTokenTvl ?? 0,
      participatingTokenTvl: 0,
      dex: "carbondefi",
    }));
  };

  const bitsave = await getBitSave();
  const carbondefi = await getCarbonDeFi();

  const aggregated: PoolRecord[] = [
    ...dex,
    ...ubeGoodDollar,
    ube,
    refi,
    kokonut,
    agroforest,
    web3i,
    regfi,
    regfi2,
    regfi3,
    refidao,
    refidao2,
    cmcsg,
    bitsave,
    ...carbondefi,
  ];

  return aggregated;
};

const getRegen = async () => {
  const tokenPrices = await fetchTokenPrices();
  const celoPrice = await getCeloPrice();

  const regfi = await getRegenerativeFi({
    poolAddr:
      "0x1ba154c0bdcfb406090f4379a3f5206549cd6e1400020000000000000000000b",

    name: "regen/regenerative.fi",
    participatingToken: {
      addr: "0x471ece3750da237f93b8e339c536989b8978a438", // Celo
      price: celoPrice,
    },
    incentiveToken: {
      addr: "0x2e6c05f1f7d1f4eb9a088bf12257f1647682b754", // AxlRegen
      price: getTokenPrice(
        "0x2e6c05f1f7d1f4eb9a088bf12257f1647682b754",
        tokenPrices
      ),
    },
  });

  const refidaoRegen = await getRegenerativeFi({
    poolAddr:
      "0x797960d015328961fa8e1a3303acf71bcf4b54c8000200000000000000000009",

    name: "ReFiDAO",
    participatingToken: {
      addr: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", // USDC
    },
    incentiveToken: {
      addr: "0x2e6c05f1f7d1f4eb9a088bf12257f1647682b754", // AxlRegen
      price: getTokenPrice(
        "0x2e6c05f1f7d1f4eb9a088bf12257f1647682b754",
        tokenPrices
      ),
    },
  });

  const ubeswapFarm = await getUbeswap(
    "0x9fde166e7857f8b802dcd5da79a1362730c1d9c80771ba6000082f5d6aa6de42"
  );

  const gloDollarPoolsRaw = await getDexData("celo", [
    "0x23490b2a472a4c78c30ef02256846fa1cd7d0fbd",
  ]);

  const gloDollarPools = gloDollarPoolsRaw.map((pool) => ({
    ...pool,
    token: "USDGLO", // Override token name to USDGLO instead of axlREGEN
  }));

  const regendao2 = await getRegenerativeFi({
    poolAddr:
      "0x875cb46406226d17ba85a2686737ea5359726132000200000000000000000012",
    name: "Regen DAO WETH",
    participatingToken: {
      addr: "0xD221812de1BD094f35587EE8E174B07B6167D9Af", // WETH
    },
    incentiveToken: {
      addr: "0x2e6c05f1f7d1f4eb9a088bf12257f1647682b754", // AxlRegen
      price: getTokenPrice(
        "0x2e6c05f1f7d1f4eb9a088bf12257f1647682b754",
        tokenPrices
      ),
    },
  });
  const regendao3 = await getRegenerativeFi({
    poolAddr:
      "0xefe83dde81e4494768e9196d3bf1d68b4fb49fa300020000000000000000000d",
    name: "Regen DAO USDGLO",
    participatingToken: {
      addr: "0x4F604735c1cF31399C6E711D5962b2B3E0225AD3", // USDGLO
    },
    incentiveToken: {
      addr: "0x2e6c05f1f7d1f4eb9a088bf12257f1647682b754", // AxlRegen
      price: getTokenPrice(
        "0x2e6c05f1f7d1f4eb9a088bf12257f1647682b754",
        tokenPrices
      ),
    },
  });

  const aggregated: PoolRecord[] = [
    regfi,
    refidaoRegen,
    { ...ubeswapFarm, token: "ube-regen" }, // Override to match database
    ...gloDollarPools,
    regendao2,
    regendao3,
  ];

  return aggregated;
};

const getGoodDollar = async () => {
  const goodDollarPool = await getBlockScoutData(
    "0x3d9e27c04076288ebfdc4815b4f6d81b0ed1b341",
    [getGloContractAddress(celo), "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A"]
  );

  const aggregated: PoolRecord[] = [...goodDollarPool];

  return aggregated;
};

const getArbitrum = async () => {
  const UNISWAP_POOLS = [
    "0x20f960d5b11d7b35072a38abff28ab882824c9b8", // USDGLO/USDC
  ];

  const gloAddress = getGloContractAddress(arbitrum);
  const results: PoolRecord[] = [];

  for (const poolAddress of UNISWAP_POOLS) {
    const poolData = await getUniblockPoolData("arbitrum", poolAddress, gloAddress);
    if (poolData) {
      results.push(poolData);
    }
  }

  return results;
};
