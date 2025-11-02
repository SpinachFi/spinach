import { Dashboard } from "@/components/Dashboard";
import Layout from "@/components/Layout";
import { getRecords } from "@/lib/dashboard";
import { getTodayMidnight } from "@/lib/utils";
import { ACTIVE_CAMPAIGNS } from "@/consts";

export const revalidate = 300; // invalidate every 5m

export default async function Home() {
  const date = getTodayMidnight();

  const stellar = await getRecords(ACTIVE_CAMPAIGNS.STELLAR, date);

  return (
    <Layout>
      <Dashboard chain="stellar" competitions={[stellar]} date={date} />
    </Layout>
  );
}
