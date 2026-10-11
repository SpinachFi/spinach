"use client";

import { useSpiStore } from "@/store";
import { TwitterLogoIcon } from "@radix-ui/react-icons";
import { MailIcon, MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const navigation = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/case-studies", label: "Case studies" },
  { href: "/history", label: "Completed competitions" },
  { href: "/new-competition", label: "Create Competition" },
];

export function Header({ actionsDisabled = false }) {
  const { setTallyFormId } = useSpiStore();

  return (
    <header className="relative z-50 w-full border-b bg-background">
      <nav
        aria-label="Global"
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          onClick={() => setTallyFormId()}
          className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-spi-dark-green"
        >
          <Image
            height={45}
            width={173}
            className="h-auto w-[140px] sm:w-[173px]"
            priority
            src="/spinach-logo.png"
            alt="Spinach"
          />
        </Link>

        {!actionsDisabled && (
          <>
            <div className="hidden items-center gap-1 xl:flex">
              <Button
                asChild
                variant="ghost"
                className="size-11"
                aria-label="Spinach on X"
              >
                <a
                  href="https://x.com/spinachfi"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <TwitterLogoIcon className="size-5" />
                </a>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="size-11"
                aria-label="Email Spinach"
              >
                <a href="mailto:hello@spinach.fi">
                  <MailIcon className="size-5" />
                </a>
              </Button>
              {navigation.map(({ href, label }) => (
                <Button
                  key={href}
                  asChild
                  variant={href === "/new-competition" ? "secondary" : "ghost"}
                  className="min-h-11"
                >
                  <Link href={href}>{label}</Link>
                </Button>
              ))}
            </div>
            <div className="xl:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="min-h-11 gap-2"
                    aria-label="Open navigation menu"
                  >
                    <MenuIcon className="size-5" /> Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 max-w-[calc(100vw-2rem)]"
                >
                  {navigation.map(({ href, label }) => (
                    <DropdownMenuItem
                      key={href}
                      asChild
                      className="min-h-11 cursor-pointer"
                    >
                      <Link href={href}>{label}</Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="min-h-11 cursor-pointer">
                    <a
                      href="https://x.com/spinachfi"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <TwitterLogoIcon /> Spinach on X
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="min-h-11 cursor-pointer">
                    <a href="mailto:hello@spinach.fi">
                      <MailIcon /> Email us
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </nav>
    </header>
  );
}
