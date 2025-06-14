import {
  getBlockScoutData,
  getDexData,
  getOkuTradesData,
  getRefi,
  getUbeswap,
} from "@/lib/celo";
import { getGloContractAddress } from "@/lib/config";
import {
  calcDailyRewards,
  calcRewards,
  createNewProjectDefs,
  createProjectRecords,
  hasRunToday,
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

  const chainId = celo.id;
  const alreadyRun = await hasRunToday(chainId);

  if (alreadyRun) {
    return res.status(200).json({ message: "Already collected for today." });
  }

  const dex = await getDexData("celo");
  // const dexUbe = await getDexData("celo", "ubeswap");
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

  const result = await calcRewards(aggregated, calcDailyRewards("celo"));

  await createNewProjectDefs(result, chainId);

  await createProjectRecords(result, chainId);

  return res.status(200).json({ message: "Data collection completed." });
}
