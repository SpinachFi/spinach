"use client";

import * as React from "react";
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
import { MoreHorizontal } from "lucide-react";
import { PlusIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { celo, optimism } from "viem/chains";
import Summary from "./Summary";

export const columns: ColumnDef<ProjectRecord>[] = [
  {
    accessorFn: (row) => row.project.name,
    header: "Project",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.project.name}</div>
    ),
  },
  {
    accessorKey: "projectToken",
    header: "Token",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("projectToken")}</div>
    ),
  },
  {
    accessorKey: "tvl",
    header: () => <div className="text-right">Current liquidity</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("tvl"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "earnings",
    header: () => <div className="text-right">Earnings</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("earnings"));

      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "website",
    header: "Learn more",
  },
  {
    accessorKey: "addLiquidity",
    header: "Add liquidity",
  },
  {
    accessorFn: (row) => row.projectChainId.toString(),
    header: "projectChainId",
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const record = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(record.project.name)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

type ProjectRecord = {
  projectToken: string;
  projectChainId: number;
  tvl: number;
  earnings: number;
  project: {
    name: string;
    website: string | null;
    addLiquidity: string | null;
  };
};

const chainMap: { [name: string]: number } = {
  celo: celo.id,
  superchain: optimism.id,
};
const chains = Object.keys(chainMap);
const defaultChain = chains[0];

export function Dashboard({ records }: { records: ProjectRecord[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([
    {
      id: "projectChainId",
      value: chainMap[defaultChain],
    },
  ]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      projectChainId: false,
    });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const [selectedChain, setChain] = React.useState(defaultChain);

  React.useEffect(() => {
    setColumnFilters([
      {
        id: "projectChainId",
        value: chainMap[selectedChain],
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
  const { daily, liquidity } = table.getRowModel().flatRows.reduce(
    (acc, cur) => ({
      daily: acc.daily + cur.original.earnings,
      liquidity: acc.liquidity + cur.original.tvl,
    }),
    { daily: 0, liquidity: 0 }
  );

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Tabs defaultValue={defaultChain} className="w-[400px]">
          <TabsList className="h-auto">
            {chains.map((chain) => (
              <TabsTrigger
                onClick={() => setChain(chain)}
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
              className="flex flex-col justify-center cursor-pointer"
              value="create"
            >
              <PlusIcon className="size-10" />
              <span>create Spinach competition</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <Summary
        daily={daily}
        liquidity={liquidity}
        apr={50}
        projects={projects}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
      </div>
    </div>
  );
}
