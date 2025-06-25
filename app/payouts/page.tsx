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
              dex: true,
            },
          },
          reward: {
            select: {
              name: true,
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
    orderBy: [{ tokenAddress: "desc" }, { value: "desc" }],
  });

  const payouts = records.map(
    ({ processed, processedAt, value, hash, projectRecord }) => ({
      processed,
      processedAt,
      value,
      hash,
      token: projectRecord.reward?.name,
      ...projectRecord.project,
    })
  );
  return (
    <Layout>
      <Payouts payouts={payouts} date={date} />
    </Layout>
  );
}
