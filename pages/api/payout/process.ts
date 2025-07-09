import {
  createPayouts,
  findPayouts,
  getReward,
  getTodayRecords,
  processPayouts,
} from "@/lib/utils";
import { Payout } from "@prisma/client";
import { isAddress } from "ethers";
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

  try {
    const payouts = await createOrFetchPayouts(slug, rewardName);
    await processPayouts(payouts, reward.chainId, "USDGLO");
  } catch (error) {
    if (error instanceof BusinessLogicError) {
      return res.status(200).json({ message: error.message });
    }
    console.error({ error });
    return res.status(200).json({ message: "Unknown error" });
  }

  return res.status(200).json({ message: "Payouts completed." });
}

const createOrFetchPayouts = async (
  projectSlug: string,
  rewardName: string
): Promise<Payout[]> => {
  const todayPayouts = await findPayouts(projectSlug, rewardName);

  if (todayPayouts.length > 0) {
    console.log(
      `Payouts records already created for ${projectSlug} -> ${rewardName}. Fetching...`
    );
    return todayPayouts;
  }

  const projectRecords = await getTodayRecords(projectSlug, rewardName);

  for (const record of projectRecords) {
    const isValid = isAddress(record.project.payoutAddress);
    if (!isValid) {
      const msg = `Invalid payout address for project ${record.projectToken}/${record.projectChainId}`;
      console.error(msg);
      throw new BusinessLogicError(`Could not create payout records (${msg}).`);
    }

    const daily = record.reward?.value || 0;

    const isAbove = record.earnings > daily;
    if (isAbove) {
      const msg = `Invalid reward for project ${record.projectToken}/${record.projectChainId}`;
      console.error(msg);
      throw new BusinessLogicError(`Could not create payout records (${msg}).`);
    }
  }

  const payouts = await createPayouts({
    projectRecords,
  });
  console.log(`Created ${payouts.count} payout records.`);

  return findPayouts(projectSlug, rewardName);
};

class BusinessLogicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessLogicError";
  }
}
