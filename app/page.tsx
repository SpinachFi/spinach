"use client";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-poppins)]">
      <main className="flex flex-col gap-8 row-start-2 items-center">
        <Header actionsDisabled={true} />
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
            onClick={() => window.open("https://tally.so/r/w7EbWa", "_blank")}
            variant={"secondary"}
            className="mt-5 cursor-pointer"
          >
            Submit interest
          </Button>
        </div>
      </main>
    </div>
  );
}
