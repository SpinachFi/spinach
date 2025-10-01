export const getPayoutsWallet = (slug: string) => {
  const dataMap: { [key: string]: string } = {
    usdglo5: "USDGLO",
    regen4: "REGEN",
    gooddollar2: "GOODDOLLAR",
  };

  return dataMap[slug];
};
