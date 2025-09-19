import {
  calculateTVL,
  calculateTotalTVL,
  calculateTotalProjects,
  getActiveCompetitions,
} from "@/lib/competition-stats";

interface ChainConfig {
  name: string;
  icon: string;
  color: string;
  textColor: string;
  href: string;
  description: string;
  competitions: DashboardProps["competitions"];
}

export const buildChainData = (config: ChainConfig): ChainDisplayData => {
  const activeCompetitions = getActiveCompetitions(config.competitions);
  const totalTVL = calculateTotalTVL(activeCompetitions);
  const totalProjects = calculateTotalProjects(activeCompetitions);

  return {
    ...config,
    isActive: activeCompetitions.length > 0,
    activeCompetitions: activeCompetitions.length,
    totalTVL: totalTVL,
    totalProjects,
    competitions: activeCompetitions.map((comp) => ({
      name: comp.meta.token,
      slug: comp.meta.slug,
      projectCount: comp.records.length,
      tvl: calculateTVL(comp.records),
    })),
  };
};
