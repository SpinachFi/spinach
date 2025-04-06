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

  console.log(`${projects.count} new projects (${chainId}) created.`);
};

export const getTodayMidnight = () => {
  const now = new Date();

  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
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

  console.log(`${records.count} ${chainId} records created.`);
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
  return { celo: 3000, optimism: 1000 }[chain];
};

export const calcRewards = async (data: Dict, monthlyRewards: number) => {
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

  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();
  const dailyRewards = monthlyRewards / daysInMonth;
  const totalLiquidity = Object.values(whitelisted).reduce(
    (acc, cur) => acc + cur,
    0
  );

  const enriched = addRewards(whitelisted, totalLiquidity, dailyRewards);

  return enriched;
};
