import { Dashboard } from "@/components/Dashboard";
import Layout from "@/components/Layout";
import { getRecords } from "@/lib/dashboard";
import { getTodayMidnight } from "@/lib/utils";

export const revalidate = 300; // invalidate every 5m

export default async function Home() {
  const date = getTodayMidnight();

  const arbitrum = await getRecords("arbitrum", date);

  return (
    <Layout>
      <Dashboard chain="arbitrum" competitions={[arbitrum]} date={date} />
    </Layout>
  );
}