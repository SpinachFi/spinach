import { Dashboard } from "@/components/Dashboard";
import Layout from "@/components/Layout";
import { getRecords } from "@/lib/dashboard";
import { getMidnightOn } from "@/lib/utils";

export default async function Home() {
  const date = getMidnightOn(2025, 6, 1);

  const usdglo = await getRecords("usdglo", date);

  return (
    <Layout>
      <Dashboard chain="celo" competitions={[usdglo]} date={date} />
    </Layout>
  );
}
