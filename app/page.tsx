import DashboardContainer from "@/components/DashboardContainer";
import { Header } from "@/components/Header";
import Layout from "@/components/Layout";
import prisma from "@/lib/prisma";
import { getTodayMidnight } from "@/lib/utils";

import { get } from "@vercel/edge-config";

export default async function Home() {
  const whiteListedProjects = (await get("whitelistedProjects")) || [];
  const date = getTodayMidnight();

  const records = await prisma.projectRecord.findMany({
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
      projectToken: {
        in: whiteListedProjects as [],
        mode: "insensitive",
      },
    },
    orderBy: {
      tvl: "desc",
    },
  });

  const extended = groupAndSum(records);

  return (
    <Layout>
      <Header />
      <DashboardContainer records={extended} date={date} />
    </Layout>
  );
}

const groupAndSum = (records: ProjectRecord[]) => {
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
    subsummary.tvl += record.tvl;
    subsummary.earningsMap[record.reward!.name] += record.earnings;
    subsummary.currentMonthEarningsMap[record.reward!.name] +=
      record.currentMonthEarnings;
  }

  return subsummary;
};
