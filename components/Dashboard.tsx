"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CHAIN_MAP, TALLY_MAP, getChainNameById } from "@/consts";
import { toNiceDollar, toNiceToken } from "@/lib/utils";
import { calculateTVL } from "@/lib/competition-stats";
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
import { CircleDollarSign, Sprout } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import Apply from "./Apply";
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
    id: "projectChainId",
    accessorFn: (row) => row.projectChainId,
    header: "Chain",
    filterFn: "equals",
    cell: ({ getValue }) => (
      <span className="capitalize">{getChainNameById(getValue<number>())}</span>
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
              <div
                key={x.projectDex}
                className="overflow-hidden text-ellipsis max-w-[85px]"
                title={x.projectDex}
              >
                - {x.projectDex}
              </div>
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
      const incentiveToken = row.original.reward?.name;
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
              {toNiceDollar(incentiveTokenTvl, 1, "compact")} {incentiveToken}
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
            Rewards earned this calendar month.
            <br />
            Yesterday’s rewards are shown in each total’s tooltip.
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
        earnings: string;
        currentMonthEarnings: string;
      }) => (
        <SpiTooltip
          content={
            <span className="text-xs text-spi-white">
              {earnings} (yesterday)
            </span>
          }
          trigger={currentMonthEarnings}
        />
      );

      const buildTag = (dataMap: Dict) =>
        Object.keys(dataMap || {}).reduce(
          (acc, cur, index) =>
            `${acc}${index > 0 ? " + " : ""}${toNiceToken(dataMap[cur], cur)}`,
          "",
        );

      return (
        <div className="flex flex-col">
          <div>
            <El
              earnings={buildTag(row.original.earningsMap!)}
              currentMonthEarnings={buildTag(
                row.original.currentMonthEarningsMap!,
              )}
            />
          </div>
          {row.getIsExpanded() &&
            row.original.subrecords?.map((subrecord) => (
              <El
                key={subrecord.projectDex}
                earnings={buildTag(subrecord.earningsMap!)}
                currentMonthEarnings={buildTag(
                  subrecord.currentMonthEarningsMap!,
                )}
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
              small ? "h-[20px] mt-1 text-xs" : "text-xs py-1 ",
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
];

export function Dashboard({
  competitions,
  date,
  chain,
  hideCreateCompetition = false,
}: DashboardProps & { hideCreateCompetition?: boolean }) {
  const pathname = usePathname();

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "tvl", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    chain === "superchain"
      ? []
      : [
          {
            id: "projectChainId",
            value: CHAIN_MAP[chain].id,
          },
        ],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      projectChainId: chain === "superchain",
    });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const [selectedCompetiton, setSelectedCompetiton] = React.useState(
    competitions[0],
  );

  const table = useReactTable({
    data: selectedCompetiton.records,
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
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
    },
  });

  const projects = table.getRowCount();
  const liquidity = calculateTVL(
    table.getRowModel().flatRows.map((row) => row.original),
  );

  const joinLink =
    TALLY_MAP[selectedCompetiton.meta.slug] &&
    `/join-competition/${TALLY_MAP[selectedCompetiton.meta.slug]}`;

  return (
    <>
      <div className="w-full min-w-0">
        <div className={clsx("grid grid-cols-2 gap-3 lg:grid-cols-4")}>
          {competitions.map((competition, index) => (
            <Button
              key={`${competition.meta.token}-${competition.meta.startDate}-${index}`}
              className={clsx(
                "flex flex-col h-[96px] cursor-pointer border-1",
                "min-w-0 whitespace-normal",
                competition === selectedCompetiton
                  ? "border-spi-green"
                  : "shadow-sm",
              )}
              variant={"ghost"}
              onClick={() => setSelectedCompetiton(competition)}
            >
              <div className="flex flex-col">
                <div className="flex flex-wrap justify-center">
                  <span>{competition.meta.token} on&nbsp;</span>
                  <span className="first-letter:uppercase">{chain}</span>
                </div>
                {pathname === "/history" && (
                  <div className="text-xs text-spi-gray mt-1">
                    {competition.meta.slug === "usdglo" && "June 2025"}
                    {competition.meta.slug === "usdglo2" && "July 2025"}
                    {competition.meta.slug === "usdglo3" && "August 2025"}
                    {competition.meta.slug === "usdglo4" && "September 2025"}
                    {competition.meta.slug === "usdglo5" && "October 2025"}
                    {competition.meta.slug === "usdglo6" && "November 2025"}
                    {competition.meta.slug === "regen" && "July 2025"}
                    {competition.meta.slug === "regen2" && "August 2025"}
                    {competition.meta.slug === "regen3" && "September 2025"}
                    {competition.meta.slug === "gooddollar" && "September 2025"}
                    {competition.meta.slug === "stellar" && "Oct-Nov 2025"}
                    {![
                      "usdglo",
                      "usdglo2",
                      "usdglo3",
                      "usdglo4",
                      "usdglo5",
                      "usdglo6",
                      "regen",
                      "regen2",
                      "regen3",
                      "gooddollar",
                      "stellar",
                    ].includes(competition.meta.slug) &&
                      new Date(competition.meta.startDate).toLocaleDateString(
                        "en-US",
                        { month: "long", year: "numeric" },
                      )}
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                {chain === "optimism" ? (
                  <CircleDollarSign
                    style={{ width: 24, height: 24 }}
                    className="mr-2"
                  />
                ) : (
                  <Image
                    className="mr-2"
                    height={24}
                    width={24}
                    src={`/${competition.meta.token.toLowerCase()}.svg`}
                    alt={competition.meta.token}
                  />
                )}
                <Image
                  height={24}
                  width={24}
                  src={`/${chain}.svg`}
                  alt={chain}
                />
              </div>
            </Button>
          ))}
          {!hideCreateCompetition && (
            <Button
              className={clsx(
                "h-[96px] cursor-pointer border-1 border-spi-gray",
                "min-w-0 whitespace-normal",
              )}
              variant={"ghost"}
              asChild
            >
              <Link
                href="/new-competition"
                className="flex flex-col items-center justify-center w-full h-full"
              >
                <PlusIcon className="size-6 mb-1" />
                <div className="flex items-center gap-1">
                  <Sprout size={24} color="green" />
                  <span>Create Competition</span>
                </div>
              </Link>
            </Button>
          )}
        </div>
        <Summary
          showDates={pathname === "/history"}
          rewards={selectedCompetiton.meta.rewards}
          startDate={selectedCompetiton.meta.startDate}
          endDate={selectedCompetiton.meta.endDate}
          liquidity={liquidity}
          projects={projects}
        />
        <div className="rounded-md border mt-2">
          <div className="px-3 mt-4 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold mr-2">Projects competing</span>
              {joinLink && (
                <Button
                  asChild
                  className="text-xs min-h-11 text-spi-dark-green bg-spi-lgreen border-1 rounded-sm border-spi-green-gradient-2 cursor-pointer"
                  variant={"ghost"}
                >
                  <Link href={joinLink}>+ join competition</Link>
                </Button>
              )}
            </div>
            <span className="text-xs text-spi-green-gradient-2">
              {selectedCompetiton.meta.description}
            </span>
          </div>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="text-spi-dark-green"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
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
                          cell.getContext(),
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
                    Coming soon.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div></div>
        </div>
        {pathname !== "/history" && (
          <span className="block text-right text-xs mt-2 text-spi-gray">
            As of {date.toUTCString()}
          </span>
        )}
      </div>
      <Apply joinLink={joinLink} />
    </>
  );
}
