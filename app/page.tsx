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
  const baseDict: Dict = rewardNames.reduce(
    (acc, cur) => ({ ...acc, [cur]: 0 }),
    {}
  );
  const buildSummary = () => ({
    tvl: 0,
    incentiveTokenTvl: 0,
    participatingTokenTvl: 0,
    earnings: 0,
    earningsMap: { ...baseDict },
    currentMonthEarnings: 0,
    currentMonthEarningsMap: { ...baseDict },
  });

  const extended: ProjectRecord[] = [];

  for (const group of Object.values(grouped)) {
    if (!group?.length) {
      continue;
    }

    const parent = group[0];
    const summary = buildSummary();

    for (const child of group) {
      summary.tvl += child.tvl;
      summary.earningsMap[child.reward!.name] += child.earnings;
      summary.currentMonthEarningsMap[child.reward!.name] +=
        child.currentMonthEarnings;
    }

    const subrecords: ProjectRecord[] = [];

    const groupedByDex = Object.groupBy(group, (group) => group.projectDex);
    if (groupedByDex && Object.keys(groupedByDex).length > 1) {
      console.log({ groupedByDex });

      for (const dex of Object.values(groupedByDex)) {
        if (!dex?.length) {
          continue;
        }
        const subsummary = buildSummary();

        for (const child of dex) {
          subsummary.tvl += child.tvl;
          subsummary.earningsMap[child.reward!.name] += child.earnings;
          subsummary.currentMonthEarningsMap[child.reward!.name] +=
            child.currentMonthEarnings;
        }
        console.log({ tmp: { ...dex[0], ...subsummary } });
        subrecords.push({ ...dex[0], ...subsummary });
      }
    }
    extended.push({ ...parent, ...summary, subrecords });
  }

  return extended;
};
