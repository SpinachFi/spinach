type Dict = { [token: string]: number };

type ChainName = "celo" | "optimism";

type DashboardProps = {
  records: ProjectRecord[];
  date: Date;
};

type ChildrenProps = {
  children: string | JSX.Element | JSX.Element[] | (() => JSX.Element);
};
