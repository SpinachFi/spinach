"use client";

import { TALLY } from "@/consts";
import { useSpiStore } from "@/store";
import { TwitterLogoIcon } from "@radix-ui/react-icons";
import { MailIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "./ui/button";

export function Header({ actionsDisabled = false }) {
  const { setTallyFormId } = useSpiStore();

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
              height={60}
              width={231}
              priority
              className="w-auto h-auto"
              src="/spinach-logo.png"
              alt={"Spinach"}
            />
          </a>
        </div>

        {!actionsDisabled && (
          <div className="flex">
            <Button
              className="mr-1 cursor-pointer"
              variant={"ghost"}
              onClick={() => window.open("https://x.com/spinachfi", "_blank")}
            >
              <TwitterLogoIcon className="size-5" />
            </Button>
            <a href="mailto:hello@spinach.fi">
              <Button className="mr-1 cursor-pointer" variant={"ghost"}>
                <MailIcon className="size-5" />
              </Button>
            </a>
            <a href="/how-it-works">
              <Button variant={"ghost"} className="mr-1 cursor-pointer">
                How it works
              </Button>
            </a>
            <a href="/case-studies">
              <Button variant={"ghost"} className="mr-1 cursor-pointer">
                Case studies
              </Button>
            </a>
            <Button
              onClick={() => setTallyFormId(TALLY.CREATE_COMPETITION)}
              variant={"secondary"}
              className="ml-2 cursor-pointer"
            >
              Create Competition
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
}
