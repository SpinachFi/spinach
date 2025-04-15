"use client";

import { PlusIcon } from "@radix-ui/react-icons";
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
import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AVAILABLE_CHAINS, CHAIN_MAP, DEFAULT_CHAIN } from "@/consts";
import { calcDailyRewards } from "@/lib/utils";
import { useSpiStore } from "@/store";
import Image from "next/image";
import Summary from "./Summary";

export const columns: ColumnDef<ProjectRecord>[] = [
  {
    accessorFn: (row) => row.project.name,
    header: "Project",
    cell: ({ row }) => (
      <div className="flex flex-col mb-3">
        <span className="capitalize text-lg">{row.original.project.name}</span>
        <span className="flex">
          <Image
            className="mx-2"
            height={15}
            width={18}
            src="/enter.svg"
            alt="enter"
          />
          <span className="text-xs mt-1 text-spi-gray">
            {row.original.project.message}
          </span>
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
    header: () => <div className="text-right">Earnings</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("currentMonthEarnings"));

      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
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
      const nice = raw.replace(/^(https:\/\/)?(www.)?/, "").replace(/\/$/, "");

      return (
        <a href={raw} target="_blank" className="underline font-medium">
          {nice}
        </a>
      );
    },
  },
  {
    accessorFn: (row) => row.project.addLiquidity,
    header: "Add liquidity",
    cell: ({ getValue }) => {
      const url = getValue() as string;
      if (!url) {
        return "";
      }

      return (
        <a
          href={url}
          target="_blank bg-spi-green "
          className="px-2 py-1 text-xs font-medium text-spi-dark-green bg-spi-lgreen border-1 rounded-sm border-spi-green-gradient-2"
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

type ProjectRecord = {
  projectToken: string;
  projectChainId: number;
  tvl: number;
  currentMonthEarnings: number;
  project: {
    name: string;
    displayToken: string;
    website: string | null;
    addLiquidity: string | null;
    message: string | null;
    liquiditySource: string | null;
  };
};

export function Dashboard({
  records,
  date,
}: {
  records: ProjectRecord[];
  date: Date;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([
    {
      id: "projectChainId",
      value: CHAIN_MAP[DEFAULT_CHAIN],
    },
  ]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      projectChainId: false,
    });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const { selectedChain, setSelectedChain } = useSpiStore();

  React.useEffect(() => {
    setColumnFilters([
      {
        id: "projectChainId",
        value: CHAIN_MAP[selectedChain],
      },
    ]);
  }, [selectedChain]);

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
      <div className="flex items-center py-4">
        <Tabs defaultValue={DEFAULT_CHAIN} className="w-[400px]">
          <TabsList className="h-auto">
            {AVAILABLE_CHAINS.map((chain) => (
              <TabsTrigger
                onClick={() => setSelectedChain(chain)}
                className="cursor-pointer mr-5"
                key={chain}
                value={chain}
              >
                <div className="flex flex-col justify-between w-[32px]">
                  <Image
                    className="mb-3"
                    height={24}
                    width={24}
                    src="/usdglo.svg"
                    alt="USDGLO"
                  />
                  <Image
                    height={24}
                    width={24}
                    src={`/${chain}.svg`}
                    alt={chain}
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <div>USDGLO</div>
                  <div>on</div>
                  <div className="first-letter:uppercase">{chain}</div>
                </div>
              </TabsTrigger>
            ))}
            <TabsTrigger
              className="flex flex-col justify-center cursor-pointer border-1 border-spi-gray"
              onClick={() => window.open("https://tally.so/r/w7EbWa", "_blank")}
              value="create"
            >
              <PlusIcon className="size-10" />
              <span>Create Competition</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <Summary
        daily={calcDailyRewards(selectedChain)}
        liquidity={liquidity}
        projects={projects}
      />
      <div className="rounded-md border">
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
