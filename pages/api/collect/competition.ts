"use server";

import {
  fetchTokenPrices,
  getBlockScoutData,
  getDexData,
  getGarden,
  getRefi,
  getRegenerativeFi,
  getTokenPrice,
  getUbeswap,
} from "@/lib/celo";
import { getGloContractAddress } from "@/lib/config";
import {
  calcRewards,
  createProjectRecordsRewards,
  getCompetitionRewards,
  getTodayMidnight,
  hasRewardRunToday,
} from "@/lib/utils";
import { NextApiRequest, NextApiResponse } from "next";
import { celo } from "viem/chains";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const authHeader = req.headers["authorization"];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const slug = req.query?.slug as string;

  const competition = await getCompetitionRewards(slug);

  if (!competition) {
    return res
      .status(404)
      .json({ message: `Competition '${slug}' not found.` });
  }

  const today = getTodayMidnight();
  const isActive =
    competition.startDate.toISOString().split("T")[0] <=
      today.toISOString().split("T")[0] &&
    today.toISOString().split("T")[0] <=
      competition.endDate.toISOString().split("T")[0];
  if (!isActive) {
    return res
      .status(400)
      .json({ message: `Competition '${slug}' is not active.` });
  }

  if (!competition.rewards.length) {
    return res
      .status(400)
      .json({ message: `No rewards for competition '${slug}'.` });
  }

  const hasRun = await hasRewardRunToday(competition.rewards[0].id);
  if (hasRun) {
    return res
      .status(400)
      .json({ message: `Data already connected for competition '${slug}'.` });
  }
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

  const regfi = await getRegenerativeFi(
    "0xf7fee07d4410af146795021f01c54af179494cb500000000000000000000000c",
    "0x765DE816845861e75A25fCA122bb6898B8B1282a", // CUSD
    "regenerative.fi"
  );
  const regfi2 = await getRegenerativeFi(
    "0xefe83dde81e4494768e9196d3bf1d68b4fb49fa300020000000000000000000d",
    "0x2e6c05f1f7d1f4eb9a088bf12257f1647682b754", // AxlRegen
    "axlREGEN",
    getTokenPrice("0x2e6c05f1f7d1f4eb9a088bf12257f1647682b754", tokenPrices)
  );

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

  for (const reward of competition.rewards) {
    const result = await calcRewards(aggregated, reward.value);

    await createProjectRecordsRewards(result, celo.id, reward.id);
  }

  return res
    .status(200)
    .json({ message: `Competition '${slug}' data collection completed.` });
}
