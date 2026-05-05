"use client";

import { Dashboard } from "@/components/Dashboard";
import { Competition } from "@/lib/dashboard";
import { useState } from "react";
import { Button } from "./ui/button";
import clsx from "clsx";

type HistoryDashboardProps = {
  celoCompetitions: Competition[];
  stellarCompetitions: Competition[];
  superchainCompetitions: Competition[];
  celoDate: Date;
  stellarDate: Date;
  superchainDate: Date;
};

export function HistoryDashboard({
  celoCompetitions,
  stellarCompetitions,
  superchainCompetitions,
  celoDate,
  stellarDate,
  superchainDate,
}: HistoryDashboardProps) {
  const [selectedChain, setSelectedChain] = useState<"celo" | "stellar" | "superchain">("celo");

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
        <Button
          onClick={() => setSelectedChain("superchain")}
          className={clsx(
            "flex-1",
            selectedChain === "superchain"
              ? "bg-spi-dark-green text-white"
              : "bg-white text-spi-dark-green border-spi-gray"
          )}
          variant={selectedChain === "superchain" ? "default" : "outline"}
        >
          Superchain
        </Button>
      </div>

      {selectedChain === "celo" && (
        <Dashboard
          key="celo-history"
          chain="celo"
          competitions={celoCompetitions}
          date={celoDate}
          hideCreateCompetition={true}
        />
      )}
      {selectedChain === "stellar" && (
        <Dashboard
          key="stellar-history"
          chain="stellar"
          competitions={stellarCompetitions}
          date={stellarDate}
          hideCreateCompetition={true}
        />
      )}
      {selectedChain === "superchain" && (
        <Dashboard
          key="superchain-history"
          chain="superchain"
          competitions={superchainCompetitions}
          date={superchainDate}
          hideCreateCompetition={true}
        />
      )}
    </>
  );
}
