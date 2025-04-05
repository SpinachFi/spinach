import { clsx, type ClassValue } from "clsx";
import { ethers } from "ethers";
import { twMerge } from "tailwind-merge";
import { getChainRPCUrl, getGloContractAddress } from "./config";
import { Chain } from "viem";
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

  console.log(`${projects.count} new projects created.`);
};

export const getTodayMidnight = () => {
  const now = new Date();

  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

export const createProjectRecords = async (
  pools: { [token: string]: number },
  chainId: number
) => {
  const records = await prisma.projectRecord.createMany({
    data: Object.entries(pools).map(([token, tvl]) => ({
      projectToken: token,
      projectChainId: chainId,
      tvl,
      earnings: 35,
      date: getTodayMidnight(),
    })),
  });

  console.log(`${records.count} Optimism records created.`);
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
