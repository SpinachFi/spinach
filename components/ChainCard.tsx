import Image from "next/image";
import Link from "next/link";
import { toNiceDollar } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChainCardProps {
  chain: ChainDisplayData;
}

export default function ChainCard({ chain }: ChainCardProps) {
  return (
    <Link
      href={chain.href}
      aria-label={`View ${chain.name} competitions - ${
        chain.isActive
          ? `${chain.activeCompetitions} active competitions`
          : "coming soon"
      }`}
    >
      <div
        className={`${chain.color} rounded-xl p-6 border-2 hover:shadow-lg transition-all cursor-pointer h-full`}
      >
        <div className="flex items-center mb-4">
          <Image
            src={chain.icon}
            alt={`${chain.name} blockchain logo`}
            width={32}
            height={32}
            className="mr-3"
          />
          <h3 className={`text-xl font-bold ${chain.textColor}`}>
            {chain.name}
          </h3>
        </div>

        <div className="space-y-3 mb-4">
          {chain.isActive ? (
            <>
              <div className="space-y-1">
                <div className={`font-semibold ${chain.textColor}`}>
                  {chain.activeCompetitions} Active Competition
                  {chain.activeCompetitions !== 1 ? "s" : ""}
                </div>
                <div className={`font-semibold ${chain.textColor}`}>
                  {toNiceDollar(chain.totalTVL, 0)} Total TVL
                </div>
                <div className={`text-sm ${chain.textColor}`}>
                  {chain.totalProjects} Projects Participating
                </div>
              </div>

              <div className="space-y-1">
                {chain.competitions.map((comp) => (
                  <div
                    key={comp.slug}
                    className="text-xs bg-white bg-opacity-50 rounded px-2 py-1"
                  >
                    <span className="font-medium">{comp.name}</span> •{" "}
                    {toNiceDollar(comp.tvl, 0)} • {comp.projectCount} projects
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className={`text-lg font-semibold ${chain.textColor} mb-2`}>
                Coming Soon
              </div>
              <div className="text-sm text-gray-600">
                Competitions launching on {chain.name} soon
              </div>
            </div>
          )}
        </div>

        <Button variant="outline" className="w-full">
          {chain.isActive
            ? `View ${chain.name} Competitions →`
            : `Learn More →`}
        </Button>
      </div>
    </Link>
  );
}
