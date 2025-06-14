import {
  getBlockScoutData,
  getDexData,
  getOkuTradesData,
  getRefi,
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
import { get } from "@vercel/edge-config";
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
    competition.startDate <= today && today < competition.endDate;
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

  // Data collection for the competition
  const dex = await getDexData("celo");
  const ubeGoodDollar = await getBlockScoutData(
    "0x3d9e27c04076288ebfdc4815b4f6d81b0ed1b341",
    [getGloContractAddress(celo), "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A"]
  );

  const ube = await getUbeswap();
  const refi = await getRefi();
  const aggregated: PoolRecord[] = [...dex, ...ubeGoodDollar, ube, refi];

  // Fallback for missing (low vol) dexscreener data
  const okuData = await getOkuTradesData("celo");
  const whiteListedProjects: string[] =
    (await get("whitelistedProjects")) || [];
  const lowerCaseWhiteList = whiteListedProjects.map((x) => x.toLowerCase());
  const aggregatedTokens = aggregated.map((x) => x.token.toLowerCase());

  for (const oku of okuData.filter((x) =>
    lowerCaseWhiteList.includes(x.token.toLowerCase())
  )) {
    const token = oku.token.toLowerCase();
    if (aggregatedTokens.includes(token)) {
      continue;
    }
    aggregatedTokens.push(token);
    aggregated.push(oku);
  }

  for (const reward of competition.rewards) {
    const result = await calcRewards(aggregated, reward.value);

    await createProjectRecordsRewards(result, celo.id, reward.id);
  }

  return res
    .status(200)
    .json({ message: `Competition '${slug}' data collection completed.` });
}
