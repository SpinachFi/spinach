import { ACTIVE_CAMPAIGNS } from "@/consts";

export const getPayoutsWallet = (slug: string) => {
  const dataMap: { [key: string]: string } = {
    [ACTIVE_CAMPAIGNS.CELO_USDGLO]: "USDGLO",
    [ACTIVE_CAMPAIGNS.CELO_REGEN]: "REGEN",
    [ACTIVE_CAMPAIGNS.CELO_GOODDOLLAR]: "GOODDOLLAR",
    [ACTIVE_CAMPAIGNS.ARBITRUM]: "ARBITRUM",
    [ACTIVE_CAMPAIGNS.STELLAR]: "STELLAR",
    [ACTIVE_CAMPAIGNS.SUPERCHAIN]: "SUPERCHAIN",
  };

  return dataMap[slug];
};
