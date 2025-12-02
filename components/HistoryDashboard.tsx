"use client";

import { Dashboard } from "@/components/Dashboard";
import { useState } from "react";
import { Button } from "./ui/button";
import clsx from "clsx";

type HistoryDashboardProps = {
  celoCompetitions: any[];
  stellarCompetitions: any[];
  celoDate: Date;
  stellarDate: Date;
};

export function HistoryDashboard({
  celoCompetitions,
  stellarCompetitions,
  celoDate,
  stellarDate,
}: HistoryDashboardProps) {
  const [selectedChain, setSelectedChain] = useState<"celo" | "stellar">("celo");

  return (
    <>
      <div className="flex gap-2 mb-4">
        <Button
          onClick={() => setSelectedChain("celo")}
          className={clsx(
            "flex-1",
            selectedChain === "celo"
              ? "bg-spi-dark-green text-white"
              : "bg-white text-spi-dark-green border-spi-gray"
          )}
          variant={selectedChain === "celo" ? "default" : "outline"}
        >
          Celo
        </Button>
        <Button
          onClick={() => setSelectedChain("stellar")}
          className={clsx(
            "flex-1",
            selectedChain === "stellar"
              ? "bg-spi-dark-green text-white"
              : "bg-white text-spi-dark-green border-spi-gray"
          )}
          variant={selectedChain === "stellar" ? "default" : "outline"}
        >
          Stellar
        </Button>
      </div>

      {selectedChain === "celo" ? (
        <Dashboard
          key="celo-history"
          chain="celo"
          competitions={celoCompetitions}
          date={celoDate}
          hideCreateCompetition={true}
        />
      ) : (
        <Dashboard
          key="stellar-history"
          chain="stellar"
          competitions={stellarCompetitions}
          date={stellarDate}
          hideCreateCompetition={true}
        />
      )}
    </>
  );
}
