import { getCeloUniswapLpTVL, getRefi, getUbeswap } from "@/lib/celo";
import {
  createNewProjectDefs,
  createProjectRecords,
  hasRunToday,
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

  const chainId = celo.id;
  const alreadyRun = await hasRunToday(chainId);

  if (alreadyRun) {
    return res.status(200).json({ message: "Already collected for today." });
  }

  const { details: uniswapLps } = await getCeloUniswapLpTVL();

  const ube = await getUbeswap();
  const refi = await getRefi();
  const aggregated = { ...uniswapLps, ube, refi };

  await createNewProjectDefs(Object.keys(aggregated), chainId);

  await createProjectRecords(aggregated, chainId);

  return res.status(200).json({ message: "Data collection completed." });
}
