import { Header } from "@/components/Header";
import Layout from "@/components/Layout";
import { Payouts } from "@/components/Payouts";
import prisma from "@/lib/prisma";
import { getTodayMidnight } from "@/lib/utils";

export default async function PayoutsPage() {
  const date = getTodayMidnight();
  const records = await prisma.payout.findMany({
    select: {
      processed: true,
      processedAt: true,
      value: true,
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

  return (
    <Layout>
      <Header />
      <Payouts
        payouts={records.map(
          ({ processed, processedAt, value, projectRecord }) => ({
            processed,
            processedAt,
            value,
            ...projectRecord.project,
          })
        )}
        date={date}
      />
    </Layout>
  );
}
