"use client";

import Layout from "@/components/Layout";
import Tally from "@/components/Tally";
import { TALLY } from "@/consts";
import { useSpiStore } from "@/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function GoodDollarJoin() {
  const { push } = useRouter();

  const { setTallyFormId } = useSpiStore();

  useEffect(() => {
    setTallyFormId(TALLY.GOODDOLLAR);
  }, [setTallyFormId]);

  return (
    <Layout>
      <Tally onClose={() => push("/")} />
    </Layout>
  );
}