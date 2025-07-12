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

  const pools = await getPoolData();

  for (const reward of competition.rewards) {
    const result = await calcRewards(pools, reward.value);
    await createProjectRecordsRewards(result, celo.id, reward.id);
  }

  return res
    .status(200)
    .json({ message: `Competition '${slug}' data collection completed.` });
}
