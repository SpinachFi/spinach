import { CircleDollarSign } from "lucide-react";
import Image from "next/image";

export function LogoCell({
  name,
  logo,
  message,
}: {
  name: string;
  logo: string | null;
  message?: string | null;
}) {
  return (
    <div className="flex items-center">
      {logo ? (
        <Image
          src={`/favicons/${logo}`}
          height={20}
          width={20}
          className="mr-1 object-contain max-h-5 max-w-5"
          alt={name}
        />
      ) : (
        <CircleDollarSign height={20} width={20} className="mr-1" />
      )}
      <span className="font-semibold capitalize text-lg mr-3">{name}</span>
      {message && <span className="text-xs text-spi-gray">{message}</span>}
    </div>
  );
}
