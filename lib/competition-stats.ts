export type ProjectRecord = {
  tvl: number;
  [key: string]: unknown;
};

export type Competition = {
  records: ProjectRecord[];
  meta: {
    token: string;
    slug: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type CompetitionSummary = {
  name: string;
  slug: string;
  projectCount: number;
  tvl: string;
};

export const calculateTVL = (records: ProjectRecord[]) =>
  records.reduce((sum, record) => sum + (record.tvl || 0), 0);

export const calculateTotalTVL = (competitions: Competition[]) =>
  competitions.reduce((total, comp) => total + calculateTVL(comp.records), 0);

export const calculateTotalProjects = (competitions: Competition[]) =>
  competitions.reduce((total, comp) => total + comp.records.length, 0);

export const getActiveCompetitions = (competitions: Competition[]) =>
  competitions.filter((comp) => comp.records.length > 0);
