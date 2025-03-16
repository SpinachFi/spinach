import { Dashboard } from "@/components/Dashboard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import prisma from "@/lib/prisma";
import { getTodayMidnight } from "@/lib/utils";

export default async function Home() {
  const records = await prisma.projectRecord.findMany({
    select: {
      projectToken: true,
      project: {
        select: {
          name: true,
          addLiquidity: true,
          website: true,
        },
      },
      projectChainId: true,
      earnings: true,
      tvl: true,
    },
    where: {
      date: getTodayMidnight(),
    },
    orderBy: {
      tvl: "desc",
    },
  });

  return (
    <div className="grid grid-rows-[20px_1fr_20px] justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Header />
        <Dashboard records={records} />
        <Footer />
      </main>
    </div>
  );
}
