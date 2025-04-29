"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getChainNameById } from "@/consts";
import { toNiceDate, toNiceDollar } from "@/lib/utils";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { CircleCheck, CircleX } from "lucide-react";
import { LogoCell } from "./LogoCell";

export const columns: ColumnDef<PayoutRecord>[] = [
  {
    accessorFn: (row) => row.name,
    header: "Project",
    cell: ({ row }) => (
      <LogoCell name={row.original.name} logo={row.original.logo} />
    ),
  },
  {
    accessorFn: (row) => row.value,
    header: "Payout",
    cell: ({ getValue }) => (
      <span className="text-right font-medium">
        {toNiceDollar(getValue<number>())}
      </span>
    ),
  },
  {
    accessorFn: (row) => getChainNameById(row.chainId),
    header: "Chain",
    cell: ({ getValue }) => (
      <span className="capitalize">{getValue<string>()}</span>
    ),
  },
  {
    accessorFn: (row) => row.processed,
    header: "Processed",
    cell: ({ getValue }) =>
      getValue<boolean>() ? (
        <CircleCheck className="text-spi-green" />
      ) : (
        <CircleX />
      ),
  },
];

export function Payouts({ payouts, date }: PayoutTableProps) {
  const table = useReactTable({
    data: payouts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="w-full">
      <div className="rounded-md border mt-2">
        <div className="ml-2 mt-5 mb-2">
          <span className="font-semibold mr-2">Project payouts</span>
          <span className="text-xs text-spi-green-gradient-2">
            {toNiceDate(date)}
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
