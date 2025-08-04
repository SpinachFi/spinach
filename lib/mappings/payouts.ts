export const getPayoutsWallet = (slug: string) => {
  const dataMap: { [key: string]: string } = {
    usdglo3: "USDGLO",
    regen2: "REGEN",
  };

  return dataMap[slug];
};
