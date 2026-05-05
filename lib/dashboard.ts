import prisma from "@/lib/prisma";
import { ACTIVE_CAMPAIGNS } from "@/consts";

export type Competition = Awaited<ReturnType<typeof getRecords>>;

const CHAIN_SLUG_PREFIXES = {
  celo: ["usdglo", "regen", "gooddollar"],
  stellar: ["stellar"],
  superchain: ["superchain"],
} as const;

export const getCompletedCompetitions = async (
  chain: keyof typeof CHAIN_SLUG_PREFIXES
): Promise<Competition[]> => {
  const activeSlugs = new Set<string>(Object.values(ACTIVE_CAMPAIGNS));
  const prefixes = CHAIN_SLUG_PREFIXES[chain];

  // Single query per chain: pull every completed competition with all
  // nested data needed to render. We then collapse records to the latest
  // date per competition in JS — avoids the N+1 round-trips that were
  // exhausting the Postgres pool in production.
  const competitions = await prisma.competition.findMany({
    where: {
      endDate: { lt: new Date() },
      OR: prefixes.map((p) => ({ slug: { startsWith: p } })),
      slug: { notIn: Array.from(activeSlugs) },
    },
    select: {
      slug: true,
      startDate: true,
      endDate: true,
      description: true,
      rewards: {
        select: {
          name: true,
          value: true,
          records: {
            select: {
              date: true,
              projectToken: true,
              project: {
                select: {
                  name: true,
                  displayToken: true,
                  addLiquidity: true,
                  website: true,
                  message: true,
                  liquiditySource: true,
                  logo: true,
                  createdAt: true,
                },
              },
              projectChainId: true,
              projectDex: true,
              currentMonthEarnings: true,
              earnings: true,
              tvl: true,
              incentiveTokenTvl: true,
              participatingTokenTvl: true,
              rewardId: true,
              reward: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { startDate: "asc" },
  });

  return competitions.map((competition) => {
    // Find latest record date across all rewards for this competition.
    const latestTime = competition.rewards
      .flatMap((r) => r.records)
      .reduce((max, r) => Math.max(max, r.date.getTime()), 0);

    // Filter each reward's records to only the latest date.
    const rewardsAtLatest = competition.rewards.map((reward) => ({
      ...reward,
      records: latestTime
        ? reward.records.filter((r) => r.date.getTime() === latestTime)
        : [],
    }));

    const records = rewardsAtLatest.flatMap((reward) => reward.records);

    return {
      meta: {
        slug: competition.slug,
        startDate: competition.startDate,
        endDate: competition.endDate,
        description: competition.description,
        token: rewardsAtLatest[0]?.name || "",
        rewards: rewardsAtLatest.reduce(
          (acc, { name, value }) => ({ ...acc, [name]: value }),
          {} as Dict
        ),
      },
      records: groupAndSum(records),
    };
  });
};

export const getRecords = async (slug: string, date: Date) => {
  try {
    const competition = await prisma.competition.findUniqueOrThrow({
    select: {
      slug: true,
      startDate: true,
      endDate: true,
      description: true,
      rewards: {
        select: {
          name: true,
          value: true,
          records: {
            select: {
              projectToken: true,
              project: {
                select: {
                  name: true,
                  displayToken: true,
                  addLiquidity: true,
                  website: true,
                  message: true,
                  liquiditySource: true,
                  logo: true,
                  createdAt: true,
                },
              },
              projectChainId: true,
              projectDex: true,
              currentMonthEarnings: true,
              earnings: true,
              tvl: true,
              incentiveTokenTvl: true,
              participatingTokenTvl: true,
              rewardId: true,
              reward: {
                select: {
                  name: true,
                },
              },
            },
            where: {
              date,
            },
          },
        },
      },
    },
    where: {
      slug,
    },
  });
  const records = competition.rewards.flatMap((reward) => reward.records) || [];

    return {
      meta: {
        slug: competition.slug,
        startDate: competition.startDate,
        endDate: competition.endDate,
        description: competition.description,
        token: competition.rewards[0]?.name || "",
        rewards: competition.rewards.reduce(
          (acc, { name, value }) => ({ ...acc, [name]: value }),
          {} as Dict
        ),
      },
      records: groupAndSum(records),
    };
  } catch {
    
    return {
      meta: {
        token: slug.toUpperCase(),
        slug,
        startDate: new Date(0),
        endDate: new Date(0),
        description: "",
        rewards: {},
      },
      records: [],
    };
  }
};

const groupAndSum = (records: ProjectRecord[]) => {
  if (!records.length) {
    return [];
  }

  const getKey = (record: ProjectRecord) =>
    [record.projectToken, record.projectChainId].join("-");

  const grouped = Object.groupBy(records, (record) => getKey(record));
  const rewardNames: string[] = records
    .map((x) => x.reward?.name)
    .filter((x) => x !== undefined);

  const extended: ProjectRecord[] = [];

  for (const group of Object.values(grouped)) {
    if (!group?.length) {
      continue;
    }

    const subrecords: ProjectRecord[] = [];

    const groupedByDex = Object.groupBy(group, (group) => group.projectDex);
    if (groupedByDex && Object.keys(groupedByDex).length > 1) {
      for (const subgroup of Object.values(groupedByDex)) {
        if (!subgroup?.length) {
          continue;
        }

        subrecords.push({
          ...subgroup[0],
          ...buildSummary(subgroup, rewardNames),
        });
      }
    }
    extended.push({
      ...group[0],
      ...buildSummary(group, rewardNames),
      subrecords,
    });
  }

  return extended;
};

const buildSummary = (records: ProjectRecord[], rewardNames: string[]) => {
  const baseDict: Dict = rewardNames.reduce(
    (acc, cur) => ({ ...acc, [cur]: 0 }),
    {}
  );

  const firstReward = Object.keys(baseDict)[0];

  const subsummary = {
    tvl: 0,
    incentiveTokenTvl: 0,
    participatingTokenTvl: 0,
    earnings: 0,
    earningsMap: { ...baseDict },
    currentMonthEarnings: 0,
    currentMonthEarningsMap: { ...baseDict },
  };

  for (const record of records) {
    if (record.reward?.name === firstReward) {
      subsummary.tvl += record.tvl;
      subsummary.incentiveTokenTvl += record.incentiveTokenTvl || 0;
      subsummary.participatingTokenTvl += record.participatingTokenTvl || 0;
    }
    subsummary.earningsMap[record.reward!.name] += record.earnings;
    subsummary.currentMonthEarningsMap[record.reward!.name] +=
      record.currentMonthEarnings;
  }

  return subsummary;
};
