import { AVAILABLE_CHAINS, CHAIN_MAP } from "@/consts";
import {
  createPayouts,
  findPayouts,
  getTodayRecords,
  processPayouts,
} from "@/lib/utils";
import { Payout } from "@prisma/client";
import { isAddress } from "ethers";
import { NextApiRequest, NextApiResponse } from "next";
import { Chain } from "viem/chains";

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

  const chainName = req.query?.chain as ChainName;

  if (!AVAILABLE_CHAINS.includes(chainName)) {
    return res.status(401).json({ message: `Incorrect chain "${chainName}"` });
  }

  const chain = CHAIN_MAP[chainName];

  try {
    const payouts = await createOrFetchPayouts(chain);
    await processPayouts(payouts, chain);
  } catch (error) {
    if (error instanceof BusinessLogicError) {
      return res.status(200).json({ message: error.message });
    }
    console.error({ error });
    return res.status(200).json({ message: "Unknown error" });
  }

  return res.status(200).json({ message: "Payouts completed." });
}

const createOrFetchPayouts = async (chain: Chain): Promise<Payout[]> => {
  const chainId = chain.id;
  const todayPayouts = await findPayouts(chainId);

  if (todayPayouts.length > 0) {
    console.log(`Payouts records already created for ${chainId}. Fetching...`);
    return todayPayouts;
  }

  const projectRecords = await getTodayRecords(chainId);

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

  return findPayouts(chainId);
};

class BusinessLogicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessLogicError";
  }
}
