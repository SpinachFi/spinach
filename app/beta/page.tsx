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
        },
      },
      projectChainId: true,
      currentMonthEarnings: true,
      earnings: true,
      tvl: true,
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

  return (
    <Layout>
      <Header />
      <DashboardContainer records={records} date={date} />
    </Layout>
  );
}
