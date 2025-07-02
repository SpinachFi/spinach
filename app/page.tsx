import Apply from "@/components/Apply";
import { Dashboard } from "@/components/Dashboard";
import Layout from "@/components/Layout";
import { getRecords } from "@/lib/dashboard";
import { getTodayMidnight } from "@/lib/utils";

export default async function Home() {
  const date = getTodayMidnight();

  const { meta, records } = await getRecords("usdglo2", date);

  return (
    <Layout>
      <Dashboard records={records} meta={meta} date={date} />
      <Apply />
    </Layout>
  );
}
