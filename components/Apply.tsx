"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";

export default function Apply({ joinLink }: { joinLink: string }) {
  if (!joinLink) {
    return null;
  }

  return (
    <div className="relative rounded-xl p-5 flex flex-col justify-center items-center bg-linear-to-r from-spi-green-gradient-1 to-spi-green-gradient-2 text-center">
      <div>
        <Image
          className="absolute -top-14 left-2"
          height={75}
          width={70}
          src="/spinach.svg"
          alt="spinach"
        />
        <div className="-z-10 absolute -top-2 left-3 size-[64px] rounded-xl bg-spi-lblue"></div>
      </div>
      <div className="text-white">
        Apply with your project to
        <br />
        claim your part of the rewards
      </div>
      <Link href={joinLink}>
        <Button
          className="mt-3 text-spi-dark-green w-[145px] cursor-pointer"
          variant={"outline"}
        >
          + join competition
        </Button>
      </Link>
    </div>
  );
}
