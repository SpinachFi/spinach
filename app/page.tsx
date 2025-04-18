"use client";

import { Header } from "@/components/Header";
import Layout from "@/components/Layout";
import Tally from "@/components/Tally";
import { Button } from "@/components/ui/button";
import { TALLY } from "@/consts";
import { useSpiStore } from "@/store";

export default function Home() {
  const { tallyFormId, setTallyFormId } = useSpiStore();
  return (
    <Layout>
      <Header actionsDisabled={true} />
      {tallyFormId ? (
        <Tally formId={tallyFormId} />
      ) : (
        <div className="flex flex-col align-middle items-center">
          <div>
            More info:{" "}
            <a
              className="font-bold"
              href="https://x.com/spinachfi"
              target="_blank"
            >
              x.com/spinachfi
            </a>
          </div>
          <div className="mt-5">Coming soon.</div>
          <Button
            onClick={() => setTallyFormId(TALLY.CREATE_COMPETITION)}
            variant={"secondary"}
            className="mt-5 cursor-pointer"
          >
            Submit interest
          </Button>
        </div>
      )}
    </Layout>
  );
}
