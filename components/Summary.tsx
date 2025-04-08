import Image from "next/image";
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
  icon: string;
};

const Card = ({ title, numbers, subtitle, icon }: CardProps) => (
  <div className="flex">
    <Image
      className="m-2"
      height={64}
      width={64}
      src={`/${icon}`}
      alt={title}
    />
    <div className="flex flex-col justify-center">
      <span className="text-spi-green">{title}</span>
      <b className="text-xl">{numbers}</b>
      <span>{subtitle || <wbr />}</span>
    </div>
  </div>
);

export default function Summary({ daily, liquidity, projects }: Props) {
  const apr = (daily * 365 * 100) / liquidity;
  return (
    <div className="flex my-3">
      <Card
        title="Daily rewards"
        numbers={`$${daily.toFixed(0)} USDGLO`}
        icon="rewards.svg"
      />
      <Separator orientation="vertical" />
      <Card
        title="Liquidity provided"
        subtitle={
          <>
            <b className="text-spi-dark-green">{Math.round(apr)}%</b> APR
          </>
        }
        numbers={`$${Math.round(liquidity).toLocaleString()}`}
        icon="liquidity.svg"
      />
      <Separator orientation="vertical" />
      <Card
        title="Project competing"
        numbers={projects.toString()}
        icon="projects.svg"
      />
    </div>
  );
}
