import { Dashboard } from "@/components/Dashboard";
import Layout from "@/components/Layout";
import { ACTIVE_CAMPAIGNS } from "@/consts";
import { getRecords } from "@/lib/dashboard";
import { getTodayMidnight } from "@/lib/utils";

export const revalidate = 300;

export default async function SuperchainPage() {
  const date = getTodayMidnight();
  const superchain = await getRecords(ACTIVE_CAMPAIGNS.SUPERCHAIN, date);

  return (
    <Layout>
      <Dashboard chain="superchain" competitions={[superchain]} date={date} />
    </Layout>
  );
}

