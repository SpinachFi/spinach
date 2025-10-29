import { getPayoutsWallet } from "@/lib/mappings/payouts";
import {
  BusinessLogicError,
  createOrFetchPayouts,
  getReward,
  processPayouts,
} from "@/lib/utils";
import { NextApiRequest, NextApiResponse } from "next";

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
  const rewardName = req.query?.reward as string;

  const reward = await getReward(slug, rewardName);

  if (!reward) {
    return res
      .status(404)
      .json({ message: `Reward ${slug}/${rewardName} not found.` });
  }

  // Stellar payouts must use the dedicated Stellar endpoint
  if (reward.chainId === 999) {
    return res.status(400).json({
      message: `Stellar payouts (chainId 999) must use /api/payout/stellar endpoint, not /api/payout/process. Please update your cron job or tooling to call /api/payout/stellar?slug=${slug}&reward=${rewardName}`,
    });
  }

  try {
    const payouts = await createOrFetchPayouts(slug, rewardName, reward.chainId);
    await processPayouts(payouts, reward.chainId, getPayoutsWallet(slug));
  } catch (error) {
    if (error instanceof BusinessLogicError) {
      return res.status(422).json({
        error: "Validation failed",
        message: error.message,
        project: slug,
        reward: rewardName
      });
    }
    console.error({ error, project: slug, reward: rewardName });
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
      project: slug,
      reward: rewardName
    });
  }

  return res.status(200).json({ message: "Payouts completed." });
}
