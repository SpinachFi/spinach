type Dict = { [token: string]: number };
type SDict = { [token: string]: string };

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
  chainId?: number;
};

type PoolRewardRecord = PoolRecord & {
  reward: number;
};

type ChainName = "celo" | "optimism" | "stellar" | "arbitrum" | "superchain" | "base" | "mainnet";
type DexName = "uniswap" | "ubeswap" | "garden" | "bitsave" | "carbondefi" | "blend" | CustomGarden;
type CustomGarden = "Network Initiatives" | "Node Kickstarter";

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
  competitions: {
    records: ProjectRecord[];
    meta: {
      slug: string;
      startDate: Date;
      endDate: Date;
      rewards: Dict;
      token: string;
      description: string | null;
    };
  }[];
  date: Date;
  chain: ChainName;
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

interface ChainDisplayData {
  name: string;
  icon: string;
  color: string;
  textColor: string;
  href: string;
  isActive: boolean;
  activeCompetitions: number;
  totalTVL: number;
  totalProjects: number;
  description: string;
  competitions: Array<{
    name: string;
    slug: string;
    projectCount: number;
    tvl: number;
  }>;
}
