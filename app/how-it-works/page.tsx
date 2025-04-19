"use client";

import { Header } from "@/components/Header";
import Layout from "@/components/Layout";
import Tally from "@/components/Tally";
import { TALLY } from "@/consts";
import { useRouter } from "next/navigation";

export default function HowItWorks() {
  const { push } = useRouter();
  return (
    <Layout>
      <Header />
      <Tally formId={TALLY.HOW_IT_WORKS} onClose={() => push("/beta")} />
    </Layout>
  );
}
