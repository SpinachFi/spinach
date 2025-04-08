import { get } from "@vercel/edge-config";
import { clsx, type ClassValue } from "clsx";
import { ethers } from "ethers";
import { twMerge } from "tailwind-merge";
import { Chain } from "viem";
import { getChainRPCUrl, getGloContractAddress } from "./config";
import prisma from "./prisma";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getBalance = async (
  address: string,
  chain: Chain,
  blockTag?: number
): Promise<bigint> => {
  const provider = new ethers.JsonRpcProvider(getChainRPCUrl(chain));
  const abi = ["function balanceOf(address account) view returns (uint256)"];
  const usdgloContract = new ethers.Contract(
    getGloContractAddress(chain),
    abi,
    provider
  );

  try {
    if (blockTag !== null) {
      return await usdgloContract.balanceOf.call(undefined, address, {
        blockTag: blockTag,
      });
    }
    return await usdgloContract.balanceOf(address);
  } catch (err) {
    console.log(`Could not fetch balance for ${address} at ${chain.id}`);
    console.error(err);
    return BigInt(0);
  }
};

export const createNewProjectDefs = async (
  tokens: string[],
  chainId: number
) => {
  const data = tokens.map((token) => ({
    name: token,
    token,
    displayToken: token,
    chainId,
  }));

  const projects = await prisma.project.createMany({
    data,
    skipDuplicates: true,
  });

  console.log(`${projects.count} new projects created (chain: ${chainId}).`);
};

// Data is being collected as of EOD.
// On 6th when job runs it saves data as of
// Sun Apr 05 2025 23:59:59 GMT+0000
export const getTodayMidnight = () => {
  const now = new Date();

  const midnight = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );

  midnight.setMilliseconds(-1);

  return midnight;
};

export const createProjectRecords = async (
  pools: { [token: string]: { tvl: number; reward: number } },
  chainId: number
) => {
  const currentMonthData = await prisma.projectRecord.groupBy({
    by: ["projectToken", "projectChainId"],
    _sum: {
      earnings: true,
    },

    where: {
      projectChainId: chainId,
      date: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });

  const currentEarnings: Dict = currentMonthData.reduce(
    (acc, cur) => ({
      ...acc,
      [cur.projectToken]: cur._sum.earnings,
    }),
    {}
  );

  const records = await prisma.projectRecord.createMany({
    data: Object.entries(pools).map(([token, { tvl, reward }]) => ({
      projectToken: token,
      projectChainId: chainId,
      tvl,
      earnings: (currentEarnings[token] || 0) + reward,
      date: getTodayMidnight(),
    })),
  });

  console.log(`${records.count} records created (chain: ${chainId}).`);
};

export const hasRunToday = async (chainId: number) => {
  const latest = await prisma.projectRecord.findFirst({
    select: {
      date: true,
    },
    orderBy: {
      date: "desc",
    },
    where: {
      projectChainId: chainId,
    },
  });
  return latest?.date.toDateString() === new Date().toDateString();
};

const addRewards = (
  data: Dict,
  totalLiquidity: number,
  dailyRewards: number
) => {
  const result: { [token: string]: { tvl: number; reward: number } } = {};

  Object.entries(data).forEach(([token, tvl]) => {
    result[token] = {
      tvl,
      reward: (tvl / totalLiquidity) * dailyRewards,
    };
  });

  return result;
};

export const calcDailyRewards = (chain: ChainName) => {
  const monthly = { celo: 3000, optimism: 1000 }[chain];

  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();
  return monthly / daysInMonth;
};

/*
  At its core, Spinach is a product to help chains distribute liquidity incentives to builders based on how much DEX liquidity there is against their project's token.

  How this works:

  1. Through the spinach protocol a chain foundation commits a certain amount of funding for a month. E.g. $3000 USDGLO for the month May.
  2. The spinach platform then calculates what $3000 is on a daily basis. May has 31 days, so it's $96.77 / day for May.
  3. Then on a daily basis, the spinach protocol is going to divide the $96.77 among participating projects based on how much liquidity they have.
  - If there's a total of $400 in liquidity provided
  - Project A has $200, Project B has $150, Project C has $50
  - Then project A gets 96.77 / 400 * 200 = $48.385, Project B gets 96.77 / 400 * 150 = $36.29, Project C gets 96.77 / 400 * 50 = $12.10
  4. Once the calculations are complete, the spinach protocol sends out these rewards to every project
  5. Upon successful sending of the rewards, it adds those rewards to that project's monthly earnings so far
  6. At the start of a new month, the project's monthly earnings reset and a new tally begins (after the first month, we'll add a feature to show historical performance)
*/
export const calcRewards = async (data: Dict, dailyRewards: number) => {
  const whiteListedProjects: string[] =
    (await get("whitelistedProjects")) || [];
  const lowerCaseWhiteList = whiteListedProjects.map((x) => x.toLowerCase());

  const whitelisted: Dict = Object.entries(data).reduce(
    (acc, [token, tvl]) => ({
      ...acc,
      ...(lowerCaseWhiteList.includes(token.toLowerCase())
        ? { [token]: tvl }
        : {}),
    }),
    {}
  );

  const totalLiquidity = Object.values(whitelisted).reduce(
    (acc, cur) => acc + cur,
    0
  );

  const enriched = addRewards(whitelisted, totalLiquidity, dailyRewards);

  return enriched;
};
