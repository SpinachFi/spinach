import prisma from "@/lib/prisma";

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
  } catch (error) {
    
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
