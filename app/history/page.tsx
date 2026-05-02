import Layout from "@/components/Layout";
import { HistoryDashboard } from "@/components/HistoryDashboard";
import { getRecords } from "@/lib/dashboard";
import { getMidnightOn } from "@/lib/utils";

export default async function Home() {
  const juneDate = getMidnightOn(2025, 5, 30);
  const julyDate = getMidnightOn(2025, 6, 31);
  const augDate = getMidnightOn(2025, 7, 31);
  const septDate = getMidnightOn(2025, 8, 31);
  const octDate = getMidnightOn(2025, 9, 31);
  const novDate = getMidnightOn(2025, 10, 30);
  const decDate = getMidnightOn(2025, 11, 31);
  const janDate = getMidnightOn(2026, 0, 31);
  const febDate = getMidnightOn(2026, 1, 28);
  const marDate = getMidnightOn(2026, 2, 31);
  const aprDate = getMidnightOn(2026, 3, 30);
  const stellarDate = getMidnightOn(2025, 10, 27);
  const stellarDecDate = getMidnightOn(2025, 11, 31);
  const stellarJanDate = getMidnightOn(2026, 0, 31);
  const stellarFebDate = getMidnightOn(2026, 1, 28);
  const stellarMarDate = getMidnightOn(2026, 2, 31);
  const stellarAprDate = getMidnightOn(2026, 3, 30);
  const superchainDecDate = getMidnightOn(2025, 11, 31);
  const superchainJanDate = getMidnightOn(2026, 0, 31);
  const superchainFebDate = getMidnightOn(2026, 1, 28);
  const superchainMarDate = getMidnightOn(2026, 2, 31);
  const superchainAprDate = getMidnightOn(2026, 3, 30);

  const juneUsdglo = await getRecords("usdglo", juneDate);
  const julyUsdglo = await getRecords("usdglo2", julyDate);
  const julyRegen = await getRecords("regen", julyDate);
  const augUsdglo = await getRecords("usdglo3", augDate);
  const augRegen = await getRecords("regen2", augDate);
  const septUsdglo = await getRecords("usdglo4", septDate);
  const septRegen = await getRecords("regen3", septDate);
  const septGooddollar = await getRecords("gooddollar", septDate);
  const octUsdglo = await getRecords("usdglo5", octDate);
  const novUsdglo = await getRecords("usdglo6", novDate);
  const decUsdglo = await getRecords("usdglo7", decDate);
  const janUsdglo = await getRecords("usdglo8", janDate);
  const febUsdglo = await getRecords("usdglo9", febDate);
  const marUsdglo = await getRecords("usdglo10", marDate);
  const aprUsdglo = await getRecords("usdglo11", aprDate);
  const stellar = await getRecords("stellar", stellarDate);
  const stellar2 = await getRecords("stellar2", stellarDecDate);
  const stellar3 = await getRecords("stellar3", stellarJanDate);
  const stellar4 = await getRecords("stellar4", stellarFebDate);
  const stellar5 = await getRecords("stellar5", stellarMarDate);
  const stellar6 = await getRecords("stellar6", stellarAprDate);
  const superchain = await getRecords("superchain", superchainDecDate);
  const superchain2 = await getRecords("superchain2", superchainJanDate);
  const superchain3 = await getRecords("superchain3", superchainFebDate);
  const superchain4 = await getRecords("superchain4", superchainMarDate);
  const superchain5 = await getRecords("superchain5", superchainAprDate);

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
        celoCompetitions={[
          juneUsdglo,
          julyUsdglo,
          julyRegen,
          augUsdglo,
          augRegen,
          septUsdglo,
          septRegen,
          septGooddollar,
          octUsdglo,
          novUsdglo,
          decUsdglo,
          janUsdglo,
          febUsdglo,
          marUsdglo,
          aprUsdglo,
        ]}
        stellarCompetitions={[stellar, stellar2, stellar3, stellar4, stellar5, stellar6]}
        superchainCompetitions={[superchain, superchain2, superchain3, superchain4, superchain5]}
        celoDate={juneDate}
        stellarDate={stellarDate}
        superchainDate={superchainDecDate}
      />
    </Layout>
  );
}
