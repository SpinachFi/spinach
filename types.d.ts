type Dict = { [token: string]: number };

type DictTvl = {
  [token: string]: {
    tvl: number;
    incentiveTokenTvl?: number;
    participatingTokenTvl?: number;
  };
};

type DictTvlReward = DictTvl & {
  [token: string]: {
    reward: number;
  };
};

type PoolRecord = {
  token: string;
  tvl: number;
  incentiveTokenTvl?: number;
  participatingTokenTvl?: number;
  dex: DexName;
};

type PoolRewardRecord = PoolRecord & {
  reward: number;
};

type ChainName = "celo" | "optimism";
type DexName = "uniswap" | "ubeswap";

type ProjectRecord = {
  projectToken: string;
  projectChainId: number;
  projectDex: string;
  tvl: number;
  incentiveTokenTvl: number | null;
  participatingTokenTvl: number | null;
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
  subrecords?: ProjectRecord[];
  rewardId?: number | null;
  reward: {
    name: string;
  } | null;
  earningsMap?: Dict;
  currentMonthEarningsMap?: Dict;
};

type DashboardProps = {
  records: ProjectRecord[];
  date: Date;
};

type PayoutTableProps = {
  payouts: PayoutRecord[];
  date: Date;
};

type ChildrenProps = {
  children?: string | JSX.Element | JSX.Element[] | (() => JSX.Element);
};

type PayoutRecord = {
  processed: boolean;
  processedAt: Date | null;
  value: number;
  hash: string | null;
  chainId: number;
  name: string;
  displayToken: string;
  logo: string | null;
  dex: string;
  token?: string;
};
