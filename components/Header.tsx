"use client";

import { TALLY } from "@/consts";
import { useSpiStore } from "@/store";
import { TwitterLogoIcon } from "@radix-ui/react-icons";
import { MailIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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
          <Link
            href="/"
            onClick={() => setTallyFormId()}
            className="-m-1.5 p-1.5"
          >
            <Image
              height={45}
              width={173}
              className="min-h-[45px] min-w-[173px]"
              priority
              src="/spinach-logo.png"
              alt={"Spinach"}
            />
          </Link>
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
            <Link href="/how-it-works">
              <Button variant={"ghost"} className="mr-1 cursor-pointer">
                How it works
              </Button>
            </Link>
            <Link href="/case-studies">
              <Button variant={"ghost"} className="mr-1 cursor-pointer">
                Case studies
              </Button>
            </Link>
            <Link href="/new-competition">
              <Button
                onClick={() => setTallyFormId(TALLY.CREATE_COMPETITION)}
                variant={"secondary"}
                className="ml-2 cursor-pointer"
              >
                Create Competition
              </Button>
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
