export const getPayoutsWallet = (slug: string) => {
  const dataMap: { [key: string]: string } = {
    usdglo2: "USDGLO",
    regen: "REGEN",
  };

  return dataMap[slug];
};
