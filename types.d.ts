type Dict = { [token: string]: number };

type ChainName = "celo" | "optimism";

type DashboardProps = {
  records: ProjectRecord[];
  date: Date;
};
