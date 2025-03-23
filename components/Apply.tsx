import Image from "next/image";
import { Button } from "./ui/button";

export default async function Apply() {
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
        Submit your project to join <br />
        Celo’s Spinach program
      </div>
      <Button
        className="mt-3 text-spi-dark-green w-[120px] cursor-pointer"
        variant={"outline"}
      >
        Apply now!
      </Button>
    </div>
  );
}
