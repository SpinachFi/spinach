"use client";

import { useSpiStore } from "@/store";
import Apply from "./Apply";
import { Dashboard } from "./Dashboard";

export default function DashboardContainer({ records, date }: DashboardProps) {
  const { tallyFormId } = useSpiStore();
  const showTallyForm = !!tallyFormId;

  if (showTallyForm) {
    return null;
  }

  return (
    <>
      <Dashboard records={records} date={new Date(date)} />
      <Apply />
    </>
  );
}
