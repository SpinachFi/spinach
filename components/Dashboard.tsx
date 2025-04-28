"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AVAILABLE_CHAINS, CHAIN_MAP, DEFAULT_CHAIN, TALLY } from "@/consts";
import { calcDailyRewards, firstOfThisMonth, toNiceDate } from "@/lib/utils";
import { useSpiStore } from "@/store";
import { GlobeIcon, InfoCircledIcon, PlusIcon } from "@radix-ui/react-icons";
import {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { CircleDollarSign, Sprout } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { celo } from "viem/chains";
import Summary from "./Summary";
import { Button } from "./ui/button";

export const columns: ColumnDef<ProjectRecord>[] = [
  {
    accessorFn: (row) => row.project.name,
    header: "Project",
    cell: ({ row }) => (
      <div className="flex items-center">
        {row.original.project.logo ? (
          <Image
            src={`/favicons/${row.original.project.logo}`}
            height={20}
            width={20}
            className="mr-1"
            alt={row.original.project.name}
          />
        ) : (
          <CircleDollarSign height={20} width={20} className="mr-1" />
        )}
        <span className="font-semibold capitalize text-lg mr-3">
          {row.original.project.name}
        </span>
        <span className="text-xs text-spi-gray">
          {row.original.project.message}
        </span>
      </div>
    ),
  },
  {
    accessorFn: (row) => row.project.displayToken,
    header: "Token",
    cell: ({ getValue }) => {
      const token = getValue() as string;
      const prefix = token.includes("$") || token.includes("/") ? "" : "$";
      return (
        <div className="capitalize">
          {prefix}
          {token}
        </div>
      );
    },
  },
  {
    accessorKey: "tvl",
    header: () => <div className="text-right">Current liquidity</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("tvl"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(amount);

      const url = row.original.project.liquiditySource;

      return url ? (
        <a
          href={url}
          target="_blank"
          className="float-right underline font-medium cursor-pointer"
        >
          {formatted}
        </a>
      ) : (
        <div className="text-right font-medium">{formatted}</div>
      );
    },
  },
  {
    accessorKey: "currentMonthEarnings",
    header: () => (
      <div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex items-center float-right">
              <span className="mr-1">Earnings</span>
              <InfoCircledIcon className="cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-center">
                Earnings so far since competition start on{" "}
                {toNiceDate(firstOfThisMonth())}
                <br />
                (and earnings yesterday)
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    ),
    cell: ({ row }) => {
      const currentMonthEarnings = parseFloat(
        row.getValue("currentMonthEarnings")
      );
      const earnings = row.original.earnings;

      // Format the amount as a dollar amount
      const format = (num: number) =>
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(num);

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="text-right font-medium cursor-help">
              {format(currentMonthEarnings)}
            </TooltipTrigger>
            <TooltipContent>
              <span className="text-xs text-spi-white">
                ({format(earnings)})
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorFn: (row) => row.project.website,
    header: "Learn more",
    cell: ({ getValue }) => {
      const raw = getValue() as string;
      if (!raw) {
        return "";
      }
      // Removes leading https|www and trailing /
      const nice = raw
        .replace(/^(https:\/\/)?(www.)?/, "")
        .replace(/\/.*$/, "");

      return (
        <div className="flex items-center text-spi-green">
          <GlobeIcon className="mr-1" />
          <a href={raw} target="_blank" className="font-medium">
            {nice}
          </a>
        </div>
      );
    },
  },
  {
    id: "addLiquidity",
    accessorFn: (row) => row.project.addLiquidity,
    header: () => <div className="text-right">Add liquidity</div>,
    cell: ({ getValue }) => {
      const url = getValue() as string;
      if (!url) {
        return "";
      }

      return (
        <a
          href={url}
          target="_blank"
          className="px-2 py-1 text-xs font-medium text-spi-dark-green bg-spi-lgreen border-1 rounded-sm border-spi-green-gradient-2 float-right"
        >
          Add liquidity
        </a>
      );
    },
  },
  {
    accessorFn: (row) => row.projectChainId.toString(),
    header: "projectChainId",
  },
];

export function Dashboard({ records, date }: DashboardProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([
    {
      id: "projectChainId",
      value: CHAIN_MAP[DEFAULT_CHAIN].id,
    },
  ]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      projectChainId: false,
    });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const { selectedChain, setSelectedChain, setTallyFormId } = useSpiStore();
  const isCelo = selectedChain === celo.name.toLowerCase();

  React.useEffect(() => {
    setColumnFilters([
      {
        id: "projectChainId",
        value: CHAIN_MAP[selectedChain].id,
      },
    ]);
  }, [selectedChain]);

  React.useEffect(() => {
    setSelectedChain(DEFAULT_CHAIN);
  }, [setTallyFormId, setSelectedChain]);

  const table = useReactTable({
    data: records,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const projects = table.getRowCount();
  const liquidity = table
    .getRowModel()
    .flatRows.reduce((acc, cur) => acc + cur.original.tvl, 0);

  return (
    <div className="w-full">
      <div className="w-full flex justify-between">
        {AVAILABLE_CHAINS.map((chain) => (
          <Button
            key={chain}
            className={clsx(
              "flex flex-col h-[96px] cursor-pointer border-1 flex-1 mr-3",
              chain === selectedChain ? "border-spi-green" : "shadow-sm"
            )}
            variant={"ghost"}
            onClick={() => setSelectedChain(chain)}
          >
            <div className="flex">
              <span>USDGLO on&nbsp;</span>
              <span className="first-letter:uppercase">{chain}</span>
            </div>
            <div className="flex justify-between">
              <Image
                className="mr-2"
                height={24}
                width={24}
                src="/usdglo.svg"
                alt="USDGLO"
              />
              <Image height={24} width={24} src={`/${chain}.svg`} alt={chain} />
            </div>
          </Button>
        ))}
        <Link href="/new-competition" className="flex-1">
          <Button
            className="flex flex-col h-[96px] cursor-pointer border-1 border-spi-gray w-full"
            variant={"ghost"}
          >
            <PlusIcon className="size-6" />
            <div className="flex items-center">
              <Sprout size={24} color="green" />
              <span>Create Competition</span>
            </div>
          </Button>
        </Link>
      </div>
      <Summary
        daily={calcDailyRewards(selectedChain)}
        liquidity={liquidity}
        projects={projects}
      />
      <div className="rounded-md border mt-2">
        <div className="ml-2 mt-5 mb-2">
          <div>
            <span className="font-semibold mr-2">Projects competing</span>
            <Button
              className="text-xs h-[24px] text-spi-dark-green bg-spi-lgreen border-1 rounded-sm border-spi-green-gradient-2 w-[145px] cursor-pointer"
              hidden={!isCelo}
              variant={"ghost"}
              onClick={() => setTallyFormId(TALLY.CELO)}
            >
              + join competition
            </Button>
          </div>
          <span className="text-xs text-spi-green-gradient-2">
            for funding by rallying their community to add $TOKEN$ liquidity
          </span>
        </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-spi-dark-green">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div></div>
      </div>
      <span className="float-right text-xs mt-1 text-spi-gray">
        As of {date.toUTCString()}
      </span>
    </div>
  );
}
