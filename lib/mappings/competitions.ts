"use server";

import {
  fetchTokenPrices,
  getBlockScoutData,
  getCeloPrice,
  getDexData,
  getGarden,
  getRefi,
  getRegenerativeFi,
  getTokenPrice,
  getUbeswap,
} from "@/lib/celo";
import { getGloContractAddress } from "@/lib/config";
import { celo } from "viem/chains";

export const getPoolDataFunc = (slug: string) => {
  const dataMap: { [key: string]: () => Promise<PoolRecord[]> } = {
    usdglo: getUsdglo,
    usdglo2: getUsdglo,
    regen: getRegen,
  };

  return dataMap[slug];
};

const getUsdglo = async () => {
  const tokenPrices = await fetchTokenPrices();

  // Data collection for the competition
  const dex = await getDexData("celo");
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

  const regfi = await getRegenerativeFi({
    poolAddr:
      "0xf7fee07d4410af146795021f01c54af179494cb500000000000000000000000c",
    name: "regenerative.fi",
    participatingToken: {
      addr: "0x765DE816845861e75A25fCA122bb6898B8B1282a", // CUSD
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
    refidao,
    refidao2,
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

  const aggregated: PoolRecord[] = [regfi];
  return aggregated;
};
