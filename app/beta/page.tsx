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

  const getKey = (record: ProjectRecord) =>
    [record.projectToken, record.projectChainId].join("-");

  const grouped = Object.groupBy(records, (record) => getKey(record));

  const extended: ProjectRecord[] = Object.values(grouped)
    .map((group) => {
      if (!group?.length) return null;
      if (group?.length === 1) return group[0];
      const oldest = group.sort(
        (a, b) => a.project.createdAt.valueOf() - b.project.createdAt.valueOf()
      )[0];

      const sumTvls = group.reduce(
        (acc, cur) => ({
          tvl: acc.tvl + cur.tvl,
          incentiveTokenTvl:
            acc.incentiveTokenTvl + (cur.incentiveTokenTvl || 0),
          participatingTokenTvl:
            acc.participatingTokenTvl + (cur.participatingTokenTvl || 0),
        }),
        {
          tvl: 0,
          incentiveTokenTvl: 0,
          participatingTokenTvl: 0,
        }
      );

      return {
        ...oldest,
        ...sumTvls,
        subrecords: group.sort((a, b) => b.tvl - a.tvl), // Inner sort by tvl desc
      };
    })
    .filter((x) => !!x);

  return (
    <Layout>
      <Header />
      <DashboardContainer records={extended} date={date} />
    </Layout>
  );
}
