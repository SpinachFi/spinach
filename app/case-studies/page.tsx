"use client";

import { Header } from "@/components/Header";
import Layout from "@/components/Layout";
import Tally from "@/components/Tally";
import { TALLY } from "@/consts";
import { useRouter } from "next/navigation";

export default function CaseStudies() {
  const { push } = useRouter();
  return (
    <Layout>
      <Header />
      <Tally formId={TALLY.CASE_STUDIES} onClose={() => push("/beta")} />
    </Layout>
  );
}
