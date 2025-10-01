import { Dashboard } from "@/components/Dashboard";
import Layout from "@/components/Layout";
import { getRecords } from "@/lib/dashboard";
import { getMidnightOn } from "@/lib/utils";

export default async function Home() {
  const juneDate = getMidnightOn(2025, 5, 30);
  const julyDate = getMidnightOn(2025, 6, 31);
  const augDate = getMidnightOn(2025, 7, 31);
  const septDate = getMidnightOn(2025, 8, 31);

  const juneUsdglo = await getRecords("usdglo", juneDate);
  const julyUsdglo = await getRecords("usdglo2", julyDate);
  const julyRegen = await getRecords("regen", julyDate);
  const augUsdglo = await getRecords("usdglo3", augDate);
  const augRegen = await getRecords("regen2", augDate);
  const septUsdglo = await getRecords("usdglo4", septDate);
  const septRegen = await getRecords("regen3", septDate);
  const septGooddollar = await getRecords("gooddollar", septDate);

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
      <Dashboard
        chain="celo"
        competitions={[
          juneUsdglo,
          julyUsdglo,
          julyRegen,
          augUsdglo,
          augRegen,
          septUsdglo,
          septRegen,
          septGooddollar,
        ]}
        date={juneDate}
        hideCreateCompetition={true}
      />
    </Layout>
  );
}
