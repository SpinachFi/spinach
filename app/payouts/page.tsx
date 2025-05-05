import { Header } from "@/components/Header";
import Layout from "@/components/Layout";
import { Payouts } from "@/components/Payouts";
import prisma from "@/lib/prisma";
import { getTodayMidnight } from "@/lib/utils";

export const revalidate = 900; // invalidate every 15m

export default async function PayoutsPage() {
  const date = getTodayMidnight();

  const records = await prisma.payout.findMany({
    select: {
      processed: true,
      processedAt: true,
      value: true,
      hash: true,
      projectRecord: {
        select: {
          project: {
            select: {
              name: true,
              displayToken: true,
              chainId: true,
              logo: true,
            },
          },
        },
      },
    },
    where: {
      projectRecord: {
        date,
      },
    },
    orderBy: {
      value: "desc",
    },
  });

  const payouts = records.map(
    ({ processed, processedAt, value, hash, projectRecord }) => ({
      processed,
      processedAt,
      value,
      hash,
      ...projectRecord.project,
    })
  );
  return (
    <Layout>
      <Header />
      <Payouts payouts={payouts} date={date} />
    </Layout>
  );
}
