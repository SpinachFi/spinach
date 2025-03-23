"use client";

import Image from "next/image";
import { Button } from "./ui/button";

export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav
        aria-label="Global"
        className="flex items-center justify-between p-6 lg:px-8"
      >
        <div className="flex lg:flex-1 align-middle">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">Spinach</span>
            <Image
              height={64}
              width={64}
              src="/spinach-logo.png"
              alt={"Spinach"}
            />
          </a>
          <div className="flex flex-col justify-center font-bold">
            <a className="text-xl">Spinach</a>
            <a className="text-sm">Liquid RetroFunding</a>
          </div>
        </div>

        <div>
          <Button variant={"ghost"} className="mr-1 cursor-pointer">
            How it works
          </Button>
          <Button variant={"ghost"} className="mr-1 cursor-pointer">
            Case studies
          </Button>
          <Button variant={"secondary"} className="ml-2 cursor-pointer">
            Create Competition
          </Button>
        </div>
      </nav>
    </header>
  );
}
