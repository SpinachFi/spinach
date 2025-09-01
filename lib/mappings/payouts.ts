export const getPayoutsWallet = (slug: string) => {
  const dataMap: { [key: string]: string } = {
    usdglo4: "USDGLO",
    regen3: "REGEN",
  };

  return dataMap[slug];
};
