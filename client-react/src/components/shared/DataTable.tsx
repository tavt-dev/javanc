import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// TanStack columns are intentionally value-variant; table callers mix accessor and display columns.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseColumnDef<T> = ColumnDef<T, any>;

export function DataTable<T>({
  data,
  columns,
  empty,
}: {
  data: T[];
  columns: LooseColumnDef<T>[];
  empty: string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const reduceMotion = useReducedMotion();
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={getAriaSort(header.column.getIsSorted())}
                    className="px-4 py-3 text-left font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        disabled={!header.column.getCanSort()}
                        aria-label={`Sort by ${getHeaderLabel(header.column.columnDef.header)}`}
                        className="inline-flex items-center gap-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-default"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && <ArrowUpDown size={13} />}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, index) => (
                <motion.tr
                  key={row.id}
                  initial={
                    reduceMotion || index > 19 ? undefined : { opacity: 0, y: 4 }
                  }
                  animate={
                    reduceMotion || index > 19 ? undefined : { opacity: 1, y: 0 }
                  }
                  transition={{ duration: 0.16, delay: Math.min(index, 12) * 0.02 }}
                  className="transition-colors hover:bg-accent/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </motion.tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center"
                >
                  <div
                    role="status"
                    className="mx-auto max-w-sm rounded-lg border border-dashed border-border bg-muted/30 px-4 py-5 text-sm text-muted-foreground"
                  >
                    {empty}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getAriaSort(sort: false | "asc" | "desc") {
  if (sort === "asc") return "ascending";
  if (sort === "desc") return "descending";
  return "none";
}

function getHeaderLabel(header: unknown) {
  return typeof header === "string" ? header : "column";
}
