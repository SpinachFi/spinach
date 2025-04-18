"use client";

import { GlobeIcon, PlusIcon } from "@radix-ui/react-icons";
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
import { AVAILABLE_CHAINS, CHAIN_MAP, DEFAULT_CHAIN, TALLY } from "@/consts";
import { calcDailyRewards } from "@/lib/utils";
import { useSpiStore } from "@/store";
import { Sprout } from "lucide-react";
import Image from "next/image";
import { celo } from "viem/chains";
import Summary from "./Summary";
import { Button } from "./ui/button";

export const columns: ColumnDef<ProjectRecord>[] = [
  {
    accessorFn: (row) => row.project.name,
    header: "Project",
    cell: ({ row }) => (
      <div className="flex items-center">
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
          target="_blank"
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

export function Dashboard({ records, date }: DashboardProps) {
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

  const { selectedChain, setSelectedChain, setTallyFormId } = useSpiStore();
  const isCelo = selectedChain === celo.name.toLowerCase();

  React.useEffect(() => {
    setColumnFilters([
      {
        id: "projectChainId",
        value: CHAIN_MAP[selectedChain],
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
      <div className="flex items-center py-4">
        <Tabs defaultValue={DEFAULT_CHAIN} className="w-full">
          <TabsList className="h-auto w-full">
            {AVAILABLE_CHAINS.map((chain) => (
              <TabsTrigger
                onClick={() => setSelectedChain(chain)}
                className="flex flex-col cursor-pointer mr-5"
                key={chain}
                value={chain}
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
                  <Image
                    height={24}
                    width={24}
                    src={`/${chain}.svg`}
                    alt={chain}
                  />
                </div>
              </TabsTrigger>
            ))}
            <TabsTrigger
              className="flex flex-col justify-center cursor-pointer border-1 border-spi-gray"
              onClick={() => setTallyFormId(TALLY.CREATE_COMPETITION)}
              value="create"
            >
              <PlusIcon className="size-6" />
              <div className="flex items-center">
                <Sprout size={24} color="green" />
                <span>Create Competition</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <Summary
        daily={calcDailyRewards(selectedChain)}
        liquidity={liquidity}
        projects={projects}
      />
      <div>
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
      <div className="rounded-md border mt-2">
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
