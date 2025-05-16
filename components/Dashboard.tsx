"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AVAILABLE_CHAINS, CHAIN_MAP, DEFAULT_CHAIN, TALLY } from "@/consts";
import {
  calcDailyRewards,
  firstOfThisMonth,
  toNiceDate,
  toNiceDollar,
} from "@/lib/utils";
import { useSpiStore } from "@/store";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  GlobeIcon,
  InfoCircledIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
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
import { Sprout } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { celo } from "viem/chains";
import { LogoCell } from "./LogoCell";
import SpiTooltip from "./SpiTooltip";
import Summary from "./Summary";
import { Button } from "./ui/button";

export const columns: ColumnDef<ProjectRecord>[] = [
  {
    accessorFn: (row) => row.project.name,
    header: "Project",
    cell: ({ row }) => (
      <LogoCell
        name={row.original.project.name}
        logo={row.original.project.logo}
        message={row.original.project.message}
      />
    ),
  },
  {
    accessorFn: (row) => row.project.displayToken,
    header: "Token",
    cell: ({ row, getValue }) => {
      const token = getValue<string>();
      const prefix = token.includes("$") || token.includes("/") ? "" : "$";
      return (
        <div className="capitalize" onClick={() => row.toggleExpanded()}>
          {prefix}
          {token}
          {row.getIsExpanded() &&
            row.original.subrecords?.map((x) => (
              <div key={x.projectDex}>- {x.projectDex}</div>
            ))}
        </div>
      );
    },
  },
  {
    accessorKey: "tvl",
    header: "Current liquidity",
    cell: ({ row }) => {
      const token = row.original.project.displayToken;

      const El = ({
        tvl,
        incentiveTokenTvl,
        participatingTokenTvl,
        url,
      }: {
        tvl: number;
        incentiveTokenTvl: number | null;
        participatingTokenTvl: number | null;
        url: string | null;
      }) => (
        <SpiTooltip
          content={
            <p className="text-center">
              {toNiceDollar(incentiveTokenTvl, 1, "compact")} USDGLO
              {participatingTokenTvl !== null &&
                ` and ${toNiceDollar(participatingTokenTvl, 1, "compact")} ${token}`}
            </p>
          }
          showContent={!!incentiveTokenTvl}
          trigger={
            <div className="flex items-center">
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  className="float-right underline font-medium cursor-pointer"
                >
                  {toNiceDollar(tvl, 0)}
                </a>
              ) : (
                <div className="text-right font-medium">
                  {toNiceDollar(tvl, 0)}
                </div>
              )}
            </div>
          }
        />
      );

      return (
        <div className="flex flex-col float-left">
          <El
            tvl={row.getValue<number>("tvl")}
            incentiveTokenTvl={row.original.incentiveTokenTvl}
            participatingTokenTvl={row.original.participatingTokenTvl}
            url={row.original.project.liquiditySource}
          />
          {row.getIsExpanded() &&
            row.original.subrecords?.map((x) => (
              <El
                key={x.projectDex}
                tvl={x.tvl}
                incentiveTokenTvl={x.incentiveTokenTvl}
                participatingTokenTvl={x.participatingTokenTvl}
                url={x.project.liquiditySource}
              />
            ))}
        </div>
      );
    },
  },
  {
    accessorKey: "currentMonthEarnings",
    header: () => (
      <SpiTooltip
        content={
          <p className="text-center">
            Earnings so far since competition start on{" "}
            {toNiceDate(firstOfThisMonth())}
            <br />
            (and earnings yesterday)
          </p>
        }
        trigger={
          <div className="flex items-center">
            <span className="mr-1">Earnings</span>
            <InfoCircledIcon className="cursor-help" />
          </div>
        }
      />
    ),
    cell: ({ row }) => {
      const El = ({
        earnings,
        currentMonthEarnings,
      }: {
        earnings: number;
        currentMonthEarnings: number;
      }) => (
        <SpiTooltip
          content={
            <span className="text-xs text-spi-white">
              {toNiceDollar(earnings)}
            </span>
          }
          trigger={toNiceDollar(currentMonthEarnings)}
        />
      );
      return (
        <div className="flex flex-col">
          <El
            earnings={row.original.earnings}
            currentMonthEarnings={row.getValue<number>("currentMonthEarnings")}
          />
          {row.getIsExpanded() &&
            row.original.subrecords?.map((x) => (
              <El
                key={x.projectDex}
                earnings={x.earnings}
                currentMonthEarnings={x.currentMonthEarnings}
              />
            ))}
        </div>
      );
    },
  },
  {
    accessorFn: (row) => row.project.website,
    header: "Learn more",
    cell: ({ getValue }) => {
      const raw = getValue<string>();
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
    cell: ({ row, getValue }) => {
      const El = ({
        url,
        small = false,
      }: {
        url: string | null;
        small?: boolean;
      }) =>
        url ? (
          <a
            href={url}
            target="_blank"
            className={clsx(
              "px-2 font-medium text-spi-dark-green bg-spi-lgreen border-1 rounded-sm border-spi-green-gradient-2 float-right",
              small ? "h-[20px] mt-1 text-xs" : "text-xs py-1 "
            )}
          >
            Add liquidity
          </a>
        ) : null;

      const canExpand =
        row.original.subrecords && row.original.subrecords.length;
      return (
        <div className="flex flex-col items-end">
          {!canExpand ? (
            <El url={getValue<string>()} />
          ) : (
            <div
              className="cursor-pointer"
              onClick={() => row.toggleExpanded()}
            >
              {row.getIsExpanded() ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </div>
          )}
          {row.getIsExpanded() &&
            row.original.subrecords?.map((x) => (
              <El
                key={x.projectDex}
                url={x.project.addLiquidity}
                small={true}
              />
            ))}
        </div>
      );
    },
  },
  {
    accessorFn: (row) => row.projectChainId.toString(),
    header: "projectChainId",
  },
];

export function Dashboard({ records, date }: DashboardProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "tvl", desc: true },
  ]);
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
