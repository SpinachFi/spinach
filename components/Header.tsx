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
        <div className="flex lg:flex-1">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">Spinach</span>
            <Image
              height={32}
              width={32}
              src={
                "https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
              }
              alt={""}
            />
          </a>
          Spinach
        </div>

        <Button>CTA</Button>
      </nav>
    </header>
  );
}
