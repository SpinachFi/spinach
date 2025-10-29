import {
  BusinessLogicError,
  createOrFetchPayouts,
  getReward,
} from "@/lib/utils";
import { NextApiRequest, NextApiResponse } from "next";
import { validateStellarEnvironment, processStellarPayouts } from "@/lib/stellar";

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

  // Only process Stellar rewards (chainId 999)
  if (reward.chainId !== 999) {
    return res.status(400).json({
      message: `This endpoint only processes Stellar rewards. Reward ${slug}/${rewardName} has chainId ${reward.chainId}`,
    });
  }

  // Validate mainnet environment
  const validation = validateStellarEnvironment();
  if (!validation.valid) {
    return res.status(500).json({
      message: "Stellar mainnet environment validation failed",
      errors: validation.errors,
    });
  }

  try {
    const payouts = await createOrFetchPayouts(slug, rewardName, reward.chainId);
    await processStellarPayouts(payouts);
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

  return res.status(200).json({ message: "Stellar payouts completed." });
}
