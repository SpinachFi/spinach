import { toNiceDollar } from "@/lib/utils";

interface GlobalStatsProps {
  chainData: Array<{
    activeCompetitions: number;
    totalProjects: number;
    totalTVL: number;
  }>;
}

export default function GlobalStats({ chainData }: GlobalStatsProps) {
  const totalCompetitions = chainData.reduce(
    (sum, chain) => sum + chain.activeCompetitions,
    0
  );
  const totalProjects = chainData.reduce(
    (sum, chain) => sum + chain.totalProjects,
    0
  );
  const totalTVL = chainData.reduce((sum, chain) => sum + chain.totalTVL, 0);

  return (
    <div className="bg-gray-50 rounded-xl p-6 mt-8">
      <div className="grid md:grid-cols-3 gap-6 text-center">
        <div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {totalCompetitions}
          </div>
          <div className="text-gray-600">Active Competitions</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {totalProjects}
          </div>
          <div className="text-gray-600">Projects Competing</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {toNiceDollar(totalTVL, 0)}
          </div>
          <div className="text-gray-600">Total Value Locked</div>
        </div>
      </div>
    </div>
  );
}