type Dict = { [token: string]: number };

type ChainName = "celo" | "optimism";

type ProjectRecord = {
  projectToken: string;
  projectChainId: number;
  tvl: number;
  currentMonthEarnings: number;
  earnings: number;
  project: {
    name: string;
    displayToken: string;
    website: string | null;
    addLiquidity: string | null;
    message: string | null;
    liquiditySource: string | null;
    logo: string | null;
  };
};

type DashboardProps = {
  records: ProjectRecord[];
  date: Date;
};

type ChildrenProps = {
  children?: string | JSX.Element | JSX.Element[] | (() => JSX.Element);
};
