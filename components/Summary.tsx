import { toNiceDate } from "@/lib/utils";
import { ReactNode } from "react";
import SpiTooltip from "./SpiTooltip";

type Props = {
  liquidity: number;
  projects: number;
  startDate: Date;
  endDate: Date;
  rewards: Dict;
  showDates?: boolean;
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
    <div className="flex min-w-0 flex-col items-center text-center">
      <div className="text-spi-gray text-sm">{title}</div>
      <div className="break-words">
        <span className="font-medium text-spi-dark-green text-xl">
          {numbers}
        </span>
        {subtitle}
      </div>
      {footer && <span className="text-xs text-spi-gray">{footer}</span>}
    </div>
  );

  return (
    <div className="flex min-w-0 items-center justify-center px-4 py-5">
      <div className="flex min-w-0 flex-col items-center text-center">
        {tooltip ? <SpiTooltip content={tooltip} trigger={element} /> : element}
      </div>
    </div>
  );
};

export default function Summary({
  liquidity,
  projects,
  startDate,
  endDate,
  rewards,
  showDates = false,
}: Props) {
  const entries = Object.entries(rewards);
  const [token, reward] = entries.length > 0 ? entries[0] : ["", 0];
  const apr = liquidity ? (reward * 365 * 100) / liquidity : 0;

  return (
    <div className="grid grid-cols-1 my-3 divide-y sm:grid-cols-3 sm:divide-y-0 sm:divide-x border rounded-md shadow-sm">
      <Card
        title="Daily rewards"
        numbers={Object.entries(rewards)
          .map(
            ([token, value]) =>
              `${token.includes("USD") ? "$" : ""}${value} ${token}`,
          )
          .join(" + ")}
        footer={
          showDates
            ? `From ${toNiceDate(startDate)} - ${toNiceDate(endDate)}`
            : undefined
        }
        tooltip={`${token} 75% $OTHER 25%`}
      />
      <Card
        title="Liquidity provided"
        subtitle={
          <span className="text-spi-gray text-sm ml-2">
            ({Math.round(apr)}% APR)
          </span>
        }
        numbers={`$${Math.round(liquidity).toLocaleString()}`}
      />
      <Card title="Projects competing" numbers={projects.toString()} />
    </div>
  );
}
