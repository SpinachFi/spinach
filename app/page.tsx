import Layout from "@/components/Layout";
import ChainCard from "@/components/ChainCard";
import GlobalStats from "@/components/GlobalStats";
import { getRecords } from "@/lib/dashboard";
import { getTodayMidnight } from "@/lib/utils";
import { buildChainData } from "@/lib/chain-data";
import { ACTIVE_CAMPAIGNS } from "@/consts";

export const revalidate = 300; // invalidate every 5m

export default async function Home() {
  const date = getTodayMidnight();

  const [usdglo, regen, gooddollar, arbitrum, stellar, superchain] = await Promise.all([
    getRecords(ACTIVE_CAMPAIGNS.CELO_USDGLO, date),
    getRecords(ACTIVE_CAMPAIGNS.CELO_REGEN, date),
    getRecords(ACTIVE_CAMPAIGNS.CELO_GOODDOLLAR, date),
    getRecords(ACTIVE_CAMPAIGNS.ARBITRUM, date),
    getRecords(ACTIVE_CAMPAIGNS.STELLAR, date),
    getRecords(ACTIVE_CAMPAIGNS.SUPERCHAIN, date),
  ]);

  const chainData = [
    buildChainData({
      name: "Celo",
      icon: "/celo.svg",
      color: "bg-green-100 border-green-300",
      textColor: "text-green-800",
      href: "/celo",
      description: "Sustainable DeFi on mobile-first blockchain",
      competitions: [usdglo, regen, gooddollar],
    }),
    buildChainData({
      name: "Arbitrum",
      icon: "/arbitrum.svg",
      color: "bg-blue-100 border-blue-300",
      textColor: "text-blue-800",
      href: "/arbitrum",
      description: "Fast, low-cost Ethereum Layer 2",
      competitions: [arbitrum],
    }),
    buildChainData({
      name: "Stellar",
      icon: "/stellar.svg",
      color: "bg-purple-100 border-purple-300",
      textColor: "text-purple-800",
      href: "/stellar",
      description: "Global payments and financial access",
      competitions: [stellar],
    }),
    buildChainData({
      name: "Superchain",
      icon: "/superchain.svg",
      color: "bg-red-100 border-red-300",
      textColor: "text-red-800",
      href: "/superchain",
      description: "Unified liquidity across Ethereum, Optimism, and Base",
      competitions: [superchain],
    }),
  ];

  return (
    <Layout>
      <div className="w-full max-w-6xl mx-auto space-y-8">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Liquidity Competitions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Projects earn daily rewards for integrating and growing liquidity
            for incentivized tokens.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {chainData.map((chain) => (
            <ChainCard key={chain.href} chain={chain} />
          ))}
        </div>

        <GlobalStats chainData={chainData} />
      </div>
    </Layout>
  );
}
