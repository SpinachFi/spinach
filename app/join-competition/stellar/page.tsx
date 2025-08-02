"use client";

import Layout from "@/components/Layout";
import Tally from "@/components/Tally";
import { TALLY } from "@/consts";
import { useSpiStore } from "@/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HowItWorks() {
  const { push } = useRouter();

  const { setTallyFormId } = useSpiStore();

  useEffect(() => {
    setTallyFormId(TALLY.STELLAR);
  }, [setTallyFormId]);

  return (
    <Layout>
      <Tally onClose={() => push("/")} />
    </Layout>
  );
}
