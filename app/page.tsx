"use client";

import { Header } from "@/components/Header";
import Tally from "@/components/Tally";
import { Button } from "@/components/ui/button";
import { TALLY } from "@/consts";
import { useSpiStore } from "@/store";

export default function Home() {
  const { tallyFormId, setTallyFormId } = useSpiStore();
  return (
    <div className="grid grid-rows-[20px_1fr_20px] justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-poppins)]">
      <main className="flex flex-col gap-8 row-start-2 items-center w-xl">
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
      </main>
    </div>
  );
}
