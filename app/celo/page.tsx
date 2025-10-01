import { Dashboard } from "@/components/Dashboard";
import Layout from "@/components/Layout";
import { getRecords } from "@/lib/dashboard";
import { getTodayMidnight } from "@/lib/utils";

export const revalidate = 300; // invalidate every 5m

export default async function CeloPage() {
  const date = getTodayMidnight();

  const usdglo = await getRecords("usdglo5", date);
  const regen = await getRecords("regen4", date);
  const gooddollar = await getRecords("gooddollar2", date);

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
