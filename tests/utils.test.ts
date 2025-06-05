import { addRewards, rewardSplit } from "@/lib/utils";

const DAILY_REWARDS = 100;

describe("Utils tests", () => {
  it("Adds rewards for empty list", () => {
    const pools: PoolRecord[] = [];
    const result = addRewards(pools, DAILY_REWARDS);

    expect(result).toEqual([]);
  });

  it("Adds rewards for 1 item", () => {
    const record: PoolRecord = {
      token: "token",
      dex: "uniswap",
      tvl: 10000,
    };
    const result = addRewards([record], DAILY_REWARDS);

    expect(result).toEqual([{ ...record, reward: DAILY_REWARDS }]);
  });

  it("Adds rewards for regular split", () => {
    const pools: PoolRecord[] = [
      {
        token: "token1",
        dex: "uniswap",
        tvl: 500,
      },
      {
        token: "token2",
        dex: "uniswap",
        tvl: 500,
      },
    ];

    const result = addRewards(pools, DAILY_REWARDS);

    expect(result.map((x) => x.reward)).toEqual([50, 50]);
  });

  it("Adds rewards for triple split", () => {
    const pools: PoolRecord[] = [
      {
        token: "token1",
        dex: "uniswap",
        tvl: 500,
      },
      {
        token: "token2",
        dex: "uniswap",
        tvl: 500,
      },
      {
        token: "token3",
        dex: "uniswap",
        tvl: 500,
      },
    ];

    const result = addRewards(pools, DAILY_REWARDS);

    expect(
      result.reduce((acc, cur) => acc + cur.reward, 0)
    ).toBeLessThanOrEqual(100);
  });

  it("Adds rewards for refi split", () => {
    const pools: PoolRecord[] = [
      {
        token: "refi",
        dex: "uniswap",
        tvl: 3000,
      },
      {
        token: "other",
        dex: "uniswap",
        tvl: 4000,
      },
    ];
    const result = addRewards(pools, DAILY_REWARDS);

    expect(result.map((x) => x.reward)).toEqual([50, 50]);
  });

  it("Adds rewards sum correctly 100", () => {
    const tvls = [
      [2, 0, 2],
      [1435, 1435, 0],
      [26512, 14609, 11903],
      [10336, 6353, 3983],
      [15770, 10525, 5244],
      [385, 192, 192],
      [10959, 4767, 6190],
      [10679, 5340, 5340],
    ];
    const pools: PoolRecord[] = tvls.map(
      ([tvl, incentiveTokenTvl, participatingTokenTvl], index) => ({
        token: `token${index + 1}`,
        dex: "uniswap",
        tvl,
        incentiveTokenTvl,
        participatingTokenTvl,
      })
    );
    pools[1].token = "refi"; // Make one pool refi

    const result = addRewards(pools, DAILY_REWARDS);

    expect(
      result.reduce((acc, cur) => acc + cur.reward, 0)
    ).toBeLessThanOrEqual(100);
  });

  it("Splits reward for regular token just tvl", () => {
    const split = rewardSplit({ token: "token", tvl: 2000, dex: "uniswap" });
    expect(split).toEqual(1500);
  });

  it("Splits reward for regular detailed tvls", () => {
    const split = rewardSplit({
      token: "token",
      tvl: 2000,
      incentiveTokenTvl: 1000,
      participatingTokenTvl: 1000,
      dex: "uniswap",
    });
    expect(split).toEqual(1000);
  });

  it("Splits reward for refi", () => {
    const split = rewardSplit({
      token: "refi",
      tvl: 2000,
      incentiveTokenTvl: 1000,
      participatingTokenTvl: 0,
      dex: "uniswap",
    });
    expect(split).toEqual(1000);
  });

  it("Splits reward for axlregen", () => {
    const split = rewardSplit({
      token: "axlregen",
      tvl: 10987,
      incentiveTokenTvl: 4781,
      participatingTokenTvl: 6205,
      dex: "uniswap",
    });
    expect(split).toEqual(5137);

    const split2 = rewardSplit({
      token: "nature",
      tvl: 10676,
      incentiveTokenTvl: 5338,
      participatingTokenTvl: 5338,
      dex: "uniswap",
    });
    expect(split2).toEqual(5338);

    const rewards = addRewards(
      [
        {
          token: "axlregen",
          dex: "uniswap",
          tvl: 10987,
          incentiveTokenTvl: 4781,
          participatingTokenTvl: 6205,
        },
        {
          token: "nature",
          dex: "uniswap",
          tvl: 10676,
          incentiveTokenTvl: 5338,
          participatingTokenTvl: 5338,
        },
      ],
      100
    );

    expect(rewards.map((x) => x.reward)).toEqual([
      49.04057279236277, 50.95942720763723,
    ]);
  });
});
