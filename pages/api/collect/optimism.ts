import { getOptimismUniswapLpTVL } from "@/lib/optimism";
import {
  createNewProjectDefs,
  createProjectRecords,
  hasRunToday,
} from "@/lib/utils";
import { NextApiRequest, NextApiResponse } from "next";
import { optimism } from "viem/chains";

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

  const chainId = optimism.id;
  const alreadyRun = await hasRunToday(chainId);

  if (alreadyRun) {
    return res.status(200).json({ message: "Already collected for today." });
  }

  const { details: uniswapLps } = await getOptimismUniswapLpTVL();

  await createNewProjectDefs(Object.keys(uniswapLps), chainId);

  await createProjectRecords(uniswapLps, chainId);

  return res.status(200).json({ message: "Data collection completed." });
}
