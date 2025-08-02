import Apply from "@/components/Apply";
import { Dashboard } from "@/components/Dashboard";
import Layout from "@/components/Layout";
import { getRecords } from "@/lib/dashboard";
import { getTodayMidnight } from "@/lib/utils";

export const revalidate = 300; // invalidate every 5m

export default async function Home() {
  const date = getTodayMidnight();

  const usdglo = await getRecords("usdglo3", date);
  const regen = await getRecords("regen2", date);

  return (
    <Layout>
      <Dashboard chain="celo" competitions={[usdglo, regen]} date={date} />
      <Apply />
    </Layout>
  );
}
