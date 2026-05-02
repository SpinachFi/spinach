import Layout from "@/components/Layout";
import { HistoryDashboard } from "@/components/HistoryDashboard";
import { getCompletedCompetitions } from "@/lib/dashboard";

export const revalidate = 300; // invalidate every 5m

export default async function Home() {
  const [celoCompetitions, stellarCompetitions, superchainCompetitions] =
    await Promise.all([
      getCompletedCompetitions("celo"),
      getCompletedCompetitions("stellar"),
      getCompletedCompetitions("superchain"),
    ]);

  const firstStartDate = (cs: { meta: { startDate: Date } }[]) =>
    cs[0]?.meta.startDate ?? new Date();

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-center text-spi-dark-green mb-2">
          Completed Competitions
        </h1>
        <p className="text-center text-spi-gray text-sm">
          Historical performance data from past liquidity incentive competitions
        </p>
      </div>
      <HistoryDashboard
        celoCompetitions={celoCompetitions}
        stellarCompetitions={stellarCompetitions}
        superchainCompetitions={superchainCompetitions}
        celoDate={firstStartDate(celoCompetitions)}
        stellarDate={firstStartDate(stellarCompetitions)}
        superchainDate={firstStartDate(superchainCompetitions)}
      />
    </Layout>
  );
}
