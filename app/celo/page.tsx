import { Dashboard } from "@/components/Dashboard";
import Layout from "@/components/Layout";
import { getRecords } from "@/lib/dashboard";
import { getTodayMidnight } from "@/lib/utils";
import { ACTIVE_CAMPAIGNS } from "@/consts";

export const revalidate = 300; // invalidate every 5m

export default async function CeloPage() {
  const date = getTodayMidnight();

  const usdglo = await getRecords(ACTIVE_CAMPAIGNS.CELO_USDGLO, date);
  const regen = await getRecords(ACTIVE_CAMPAIGNS.CELO_REGEN, date);
  const gooddollar = await getRecords(ACTIVE_CAMPAIGNS.CELO_GOODDOLLAR, date);

  return (
    <Layout>
      <Dashboard
        chain="celo"
        competitions={[usdglo, regen, gooddollar]}
        date={date}
      />
    </Layout>
  );
}
