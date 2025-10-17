"use server";

import { getPoolDataFunc } from "@/lib/mappings/competitions";
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

  const getPoolData = getPoolDataFunc(slug);
  if (!getPoolData) {
    return res.status(400).json({
      message: `No data collection available for competition '${slug}'.`,
    });
  }

  let rawPools;
  try {
    rawPools = await getPoolData();
  } catch (error) {
    console.error(`Data collection failed for ${slug}:`, error);
    return res.status(500).json({
      message: `Data collection failed for competition '${slug}': ${String(error)}`,
    });
  }

  const chainId = competition.rewards[0]?.chainId || celo.id;

  const pools = rawPools.map((pool) => ({
    ...pool,
    chainId: chainId,
    tvl: isNaN(pool.tvl) ? 0 : pool.tvl,
    incentiveTokenTvl: isNaN(pool.incentiveTokenTvl || 0)
      ? 0
      : pool.incentiveTokenTvl || 0,
    participatingTokenTvl: isNaN(pool.participatingTokenTvl || 0)
      ? 0
      : pool.participatingTokenTvl || 0,
  }));

  for (const reward of competition.rewards) {
    const result = await calcRewards(pools, reward.value);
    await createProjectRecordsRewards(result, reward.chainId, reward.id);
  }

  return res
    .status(200)
    .json({ message: `Competition '${slug}' data collection completed.` });
}
