import Image from "next/image";
import { Separator } from "./ui/separator";
import { ReactNode } from "react";

type Props = {
  daily: number;
  liquidity: number;
  apr: number;
  projects: number;
};

type CardProps = {
  title: string;
  numbers: string;
  subtitle?: string | ReactNode;
  icon: string;
};

export default function Summary({ daily, liquidity, apr, projects }: Props) {
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
  return (
    <div className="flex my-3">
      <Card
        title="Daily rewards"
        numbers={`$${daily} USDGLO`}
        icon="rewards.svg"
      />
      <Separator orientation="vertical" />
      <Card
        title="Liquidity provided"
        subtitle={
          <>
            <b className="text-spi-dark-green">{apr}%</b> APR
          </>
        }
        numbers={`$${liquidity.toLocaleString()}`}
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
