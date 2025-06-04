import { addRewards } from "@/lib/utils";

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

    expect(result.reduce((acc, cur) => acc + cur.reward, 0)).toEqual(100);
  });
});
