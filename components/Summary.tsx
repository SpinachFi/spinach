import { ReactNode } from "react";
import { Separator } from "./ui/separator";

type Props = {
  daily: number;
  liquidity: number;
  projects: number;
};

type CardProps = {
  title: string;
  numbers: string;
  subtitle?: string | ReactNode;
};

const Card = ({ title, numbers, subtitle }: CardProps) => (
  <div className="flex items-center justify-center flex-1">
    <div className="flex flex-col justify-center items-center">
      <span className="text-spi-gray text-sm">{title}</span>
      <div>
        <span className="font-medium text-spi-dark-green text-xl">
          {numbers}
        </span>
        {subtitle}
      </div>
    </div>
  </div>
);

export default function Summary({ daily, liquidity, projects }: Props) {
  const apr = (daily * 365 * 100) / liquidity;

  return (
    <div className="flex h-[96px] my-3 justify-between border-1 rounded-sm shadow-sm">
      <Card title="Daily rewards" numbers={`$${daily.toFixed(0)} USDGLO`} />
      <Separator orientation="vertical" className="ml-8" />
      <Card
        title="Liquidity provided"
        subtitle={
          <span className="text-spi-gray text-sm ml-2">
            ({Math.round(apr)}% APR)
          </span>
        }
        numbers={`$${Math.round(liquidity).toLocaleString()}`}
      />
      <Separator orientation="vertical" className="ml-10" />
      <Card title="Project competing" numbers={projects.toString()} />
    </div>
  );
}
