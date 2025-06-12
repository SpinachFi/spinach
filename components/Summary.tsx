import { firstOfThisMonth, lastOfThisMonth, toNiceDate } from "@/lib/utils";
import { ReactNode } from "react";
import SpiTooltip from "./SpiTooltip";
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
  footer?: string;
  tooltip?: string;
};

const Card = ({ title, numbers, subtitle, footer, tooltip }: CardProps) => {
  const element = (
    <div className="flex flex-col items-center">
      <div className="text-spi-gray text-sm">{title}</div>
      <div>
        <span className="font-medium text-spi-dark-green text-xl">
          {numbers}
        </span>
        {subtitle}
      </div>
      <span className="text-xs text-spi-gray">{footer || <wbr />}</span>
    </div>
  );

  return (
    <div className="flex items-center justify-center flex-1">
      <div className="flex flex-col items-center">
        {tooltip ? <SpiTooltip content={tooltip} trigger={element} /> : element}
      </div>
    </div>
  );
};

export default function Summary({ daily, liquidity, projects }: Props) {
  const apr = (daily * 365 * 100) / liquidity;

  const Sep = () => (
    <div className="py-5">
      <Separator orientation="vertical" />
    </div>
  );

  return (
    <div className="flex h-[96px] my-3 justify-between border-1 rounded-sm shadow-sm">
      <Card
        title="Daily rewards"
        numbers={`$${daily.toFixed(0)} USDGLO`}
        footer={`From ${toNiceDate(firstOfThisMonth())} - ${toNiceDate(lastOfThisMonth())}`}
        tooltip={"USDGLO 75% $OTHER 25%"}
      />
      <Sep />
      <Card
        title="Liquidity provided"
        subtitle={
          <span className="text-spi-gray text-sm ml-2">
            ({Math.round(apr)}% APR)
          </span>
        }
        numbers={`$${Math.round(liquidity).toLocaleString()}`}
      />
      <Sep />
      <Card title="Projects competing" numbers={projects.toString()} />
    </div>
  );
}
