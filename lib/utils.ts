import { Payout } from "@prisma/client";
import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { ethers, parseEther, parseUnits } from "ethers";
import { twMerge } from "tailwind-merge";
import { Chain } from "viem";
import {
  CHAIN_RPC_URLS,
  getChainRPCUrl,
  getGloContractAddress,
} from "./config";
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
  pools: PoolRewardRecord[],
  chainId: number
) => {
  const data = pools.map((r) => ({
    name: r.token,
    token: r.token,
    displayToken: r.token,
    chainId,
    dex: r.dex,
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

export const getYesterdayMidnight = () => {
  const midnight = getTodayMidnight();

  midnight.setDate(midnight.getDate() - 1);

  return midnight;
};

export const getMidnightOn = (year: number, month: number, day: number) => {
  const midnight = new Date(Date.UTC(year, month, day));

  midnight.setMilliseconds(-1);

  return midnight;
};

export const createProjectRecords = async (
  pools: PoolRewardRecord[],
  chainId: number
) => {
  // As we run process on 2nd
  const isFirstDayOfMonth = new Date().getDate() === 2;

  const getYesterdayEarnings = async () => {
    const yesterdayData = await prisma.projectRecord.findMany({
      select: {
        projectToken: true,
        projectDex: true,
        currentMonthEarnings: true,
      },
      where: {
        projectChainId: chainId,
        date: {
          equals: getYesterdayMidnight(),
        },
      },
    });

    const yesterdayEarnings: Dict = yesterdayData.reduce(
      (acc, cur) => ({
        ...acc,
        [`${cur.projectDex}/${cur.projectToken}`]: cur.currentMonthEarnings,
      }),
      {}
    );

    return yesterdayEarnings;
  };

  const yesterdayEarnings: Dict = isFirstDayOfMonth
    ? {}
    : await getYesterdayEarnings();

  const records = await prisma.projectRecord.createMany({
    data: pools.map(
      ({
        token,
        dex,
        tvl,
        incentiveTokenTvl,
        participatingTokenTvl,
        reward,
      }) => ({
        projectToken: token,
        projectChainId: chainId,
        projectDex: dex,
        tvl,
        incentiveTokenTvl,
        participatingTokenTvl,
        earnings: reward,
        currentMonthEarnings:
          (yesterdayEarnings[`${dex}/${token}`] || 0) + reward,
        date: getTodayMidnight(),
      })
    ),
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

export const twoDecimals = (num: number) => Math.floor(num * 100) / 100;

export const rewardSplit = (pool: PoolRecord) => {
  const { token, tvl, incentiveTokenTvl, participatingTokenTvl } = pool;

  const REWARDS_SPLIT: Dict = {
    refi: 100,
  };

  // Defaults to 75% Glo (incentive token) and 25% other token (participating token)
  const incentive = (REWARDS_SPLIT[token] || 75) / 100;
  const participating = 1 - incentive;

  return (
    incentive * (incentiveTokenTvl || tvl) +
    participating * (participatingTokenTvl || 0)
  );
};

export const addRewards = (
  pools: PoolRecord[],
  dailyRewards: number
): PoolRewardRecord[] => {
  if (pools.length === 0) {
    return [];
  }

  const result = pools.map((pool) => ({
    ...pool,
    reward: rewardSplit(pool),
  }));

  const totalLiquidity = result.reduce((acc, cur) => acc + cur.reward, 0);

  const rewards = result.map((pool) => ({
    ...pool,
    reward: (pool.reward / totalLiquidity) * dailyRewards,
  }));

  const sum = rewards.reduce((acc, cur) => acc + cur.reward, 0);
  if (sum != dailyRewards) {
    const bottom = rewards.reduce(
      (min, curr) => (curr.reward < min.reward ? curr : min),
      rewards[0]
    );

    bottom.reward = dailyRewards - (sum - bottom.reward);
  }

  return rewards;
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
export const calcRewards = async (
  pools: PoolRecord[],
  dailyRewards: number
) => {
  const enriched = addRewards(pools, dailyRewards);

  return enriched;
};

export const toNiceDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

export const toNiceDollar = (
  num: number | null,
  digits = 2,
  notation:
    | "standard"
    | "scientific"
    | "engineering"
    | "compact"
    | undefined = "standard"
) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    notation,
  }).format(num || 0);

export const toNiceToken = (num: number | null, token: string) => {
  const isDollar = token.toUpperCase().includes("USD");
  if (isDollar) {
    return toNiceDollar(num);
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(num || 0)} ${token}`;
};

export const firstOfThisMonth = () => {
  const today = new Date();
  return new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1));
};

export const lastOfThisMonth = () => {
  const today = new Date();
  return new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0));
};

export const getTodayRecords = async (
  projectSlug: string,
  rewardName: string
) => {
  const res = await prisma.projectRecord.findMany({
    select: {
      id: true,
      projectToken: true,
      projectChainId: true,
      earnings: true,
      project: {
        select: {
          payoutAddress: true,
        },
      },
      reward: {
        select: {
          value: true,
          tokenAddress: true,
        },
      },
    },

    where: {
      reward: {
        name: rewardName,
        competition: {
          slug: projectSlug,
        },
      },
      date: {
        equals: getTodayMidnight(),
      },
    },
  });

  return res;
};

export const createPayouts = async ({
  projectRecords,
}: {
  projectRecords: {
    project: {
      payoutAddress: string | null;
    };
    id: number;
    projectToken: string;
    projectChainId: number;
    earnings: number;
    reward: {
      tokenAddress: string;
    } | null;
  }[];
}) => {
  return await prisma.payout.createMany({
    data: projectRecords.map((record) => ({
      projectRecordId: record.id,
      payoutAddress: record.project.payoutAddress!,
      tokenAddress: record.reward!.tokenAddress,
      value: record.earnings,
    })),
  });
};

export const findPayouts = async (projectSlug: string, rewardName: string) => {
  return await prisma.payout.findMany({
    where: {
      projectRecord: {
        reward: {
          name: rewardName,
          competition: {
            slug: projectSlug,
          },
        },
        date: getTodayMidnight(),
      },
    },
  });
};

export const getReward = async (projectSlug: string, rewardName: string) => {
  const rewards = await prisma.reward.findMany({
    where: {
      name: rewardName,
      competition: {
        slug: projectSlug,
      },
    },
  });

  if (rewards.length !== 1) {
    console.error(
      `Incorrect numbet of rewards for ${projectSlug} -> ${rewardName}`
    );
    return null;
  }

  return rewards[0];
};

export const processPayouts = async (
  payouts: Payout[],
  chainId: number,
  walletName: string
) => {
  let [total, completed] = [payouts.length, 0];

  const provider = new ethers.JsonRpcProvider(CHAIN_RPC_URLS[chainId]);
  const pk = process.env[`${walletName}_PAYOUT_PRIVATE_KEY`];
  if (!pk) {
    throw new Error(`No private key found for ${walletName}.`);
  }
  const signer = new ethers.Wallet(pk, provider);

  for (const payout of payouts) {
    if (payout.processed) {
      console.log(`Payout ${payout.id} already processed.`);
      total -= 1;
      continue;
    }

    if (payout.isProcessing) {
      console.log(`Payout ${payout.id} is being processed.`);
      continue;
    }

    console.log(`Processing payout ${payout.id}...`);

    await prisma.payout.update({
      where: {
        id: payout.id,
      },
      data: {
        isProcessing: true,
      },
    });

    const hash = await transferTo(
      {
        toAddress: payout.payoutAddress,
        amount: payout.value,
        token: payout.tokenAddress,
      },
      {
        provider,
        signer,
      }
    );
    if (!hash) {
      console.log(`Payout ${payout.id} failed.`);
      continue;
    }

    await prisma.payout.update({
      where: {
        id: payout.id,
      },
      data: {
        processed: true,
        isProcessing: false,
        hash,
        processedAt: new Date(),
      },
    });

    console.log(`Payout ${payout.id} completed.`);
    completed++;
  }

  let txt = `${completed}/${total} payouts completed for ${payouts[0].tokenAddress} @ ${chainId}.`;
  if (completed !== total) {
    txt += " Issues detected! <!here>";
  }
  await postSlack(txt);
};

const getDecimals = (tokenAddr: string) => {
  const decMap: Dict = {
    native: 18, // CELO
    "0x4f604735c1cf31399c6e711d5962b2b3e0225ad3": 18, // GLO
    "0x2e6c05f1f7d1f4eb9a088bf12257f1647682b754": 6, // AXL
  };

  return decMap[tokenAddr.toLowerCase()] || 0;
};

export const transferTo = async (
  details: {
    toAddress: string;
    amount: number;
    token: string;
  },
  config: {
    provider: ethers.JsonRpcProvider;
    signer: ethers.Wallet;
  }
) => {
  const { toAddress, amount, token } = details;
  const { signer, provider } = config;

  const decimals = getDecimals(token.toLowerCase());

  if (!decimals) {
    console.error(`Unknown token ${token}`);
    return null;
  }

  const getTxDetails = () => {
    const value = parseUnits(amount.toFixed(18), decimals);
    if (token === "native") {
      return {
        to: toAddress,
        value,
      };
    }
    const abi = [
      "function transfer(address _to, uint256 _value) public returns (bool success)",
    ];

    const usdgloContract = new ethers.Contract(token, abi, provider);

    const data = usdgloContract.interface.encodeFunctionData("transfer", [
      toAddress,
      value,
    ]);

    return {
      to: token,
      from: signer.address,
      value: parseEther("0.0"),
      data: data,
    };
  };

  try {
    const tx = await signer.sendTransaction(getTxDetails());

    console.log("Mining transaction...");

    const receipt = await tx.wait();

    console.log(`Mined in block ${receipt?.blockNumber}`);

    return tx.hash;
  } catch (err) {
    console.log({ err });
    // TODO: [RAD] Retry if nouce error
  }

  return null;
};

export const postSlack = async (text: string) => {
  const webhook = process.env.SLACK_WEBHOOK;

  if (!webhook) {
    console.log(text);
    console.warn("SLACK_WEBHOOK is not set, skipping Slack notification.");
    return;
  }

  await axios.post(webhook, {
    text,
  });
};

export const hasRewardRunToday = async (id: number) => {
  const latest = await prisma.projectRecord.findFirst({
    where: {
      rewardId: id,
    },
    orderBy: {
      date: "desc",
    },
  });

  return latest?.date.toISOString() === getTodayMidnight().toISOString();
};

export const getCompetitionRewards = async (slug: string) => {
  const competition = await prisma.competition.findUnique({
    where: {
      slug,
    },
    select: {
      startDate: true,
      endDate: true,
      rewards: {
        select: {
          id: true,
          tokenAddress: true,
          value: true,
          name: true,
        },
      },
    },
  });

  return competition;
};

export const createProjectRecordsRewards = async (
  pools: PoolRewardRecord[],
  chainId: number,
  rewardId: number
) => {
  // As we run process on 2nd
  const isFirstDayOfMonth = new Date().getDate() === 2;

  const getYesterdayEarnings = async () => {
    const yesterdayData = await prisma.projectRecord.findMany({
      select: {
        projectToken: true,
        projectDex: true,
        currentMonthEarnings: true,
      },
      where: {
        rewardId: rewardId,
        date: {
          equals: getYesterdayMidnight(),
        },
      },
    });

    const yesterdayEarnings: Dict = yesterdayData.reduce(
      (acc, cur) => ({
        ...acc,
        [`${cur.projectDex}/${cur.projectToken}`]: cur.currentMonthEarnings,
      }),
      {}
    );

    return yesterdayEarnings;
  };

  const yesterdayEarnings: Dict = isFirstDayOfMonth
    ? {}
    : await getYesterdayEarnings();

  const records = await prisma.projectRecord.createMany({
    data: pools.map(
      ({
        token,
        dex,
        tvl,
        incentiveTokenTvl,
        participatingTokenTvl,
        reward,
      }) => {
        return {
          projectToken: token,
          projectChainId: chainId,
          projectDex: dex,
          rewardId,
          tvl,
          incentiveTokenTvl,
          participatingTokenTvl,
          earnings: reward,
          currentMonthEarnings:
            (yesterdayEarnings[`${dex}/${token}`] || 0) + reward,
          date: getTodayMidnight(),
        };
      }
    ),
  });

  console.log(`${records.count} records created (reward: ${rewardId}).`);
};
