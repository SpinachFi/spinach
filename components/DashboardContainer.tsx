"use client";

import { useSpiStore } from "@/store";
import Apply from "./Apply";
import { Dashboard } from "./Dashboard";
import Tally from "./Tally";

export default function DashboardContainer({ records, date }: DashboardProps) {
  const { tallyFormId } = useSpiStore();
  const showTallyForm = !!tallyFormId;

  if (showTallyForm) {
    return <Tally formId={tallyFormId} />;
  }

  return (
    <>
      <Dashboard records={records} date={new Date(date)} />
      <Apply />
    </>
  );
}
