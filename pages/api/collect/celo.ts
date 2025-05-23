import { getDexData, getOkuTradeData, getRefi, getUbeswap } from "@/lib/celo";
import {
  calcDailyRewards,
  calcRewards,
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

  const dex = await getDexData("celo");
  const dexUbe = await getDexData("celo", "ubeswap");

  const ube = await getUbeswap();
  const refi = await getRefi();
  const aggregated: PoolRecord[] = [...dex, ...dexUbe, ube, refi];

  const NATURE = "NATURE";
  if (!aggregated.find((item) => item.token === NATURE)) {
    const oku = await getOkuTradeData(
      "0x4eb0685f69f0b87da744e159576556b709a74c09",
      "celo"
    );
    aggregated.push(oku);
  }

  const result = await calcRewards(aggregated, calcDailyRewards("celo"));

  await createNewProjectDefs(result, chainId);

  await createProjectRecords(result, chainId);

  return res.status(200).json({ message: "Data collection completed." });
}
