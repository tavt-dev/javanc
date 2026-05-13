import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, FileText } from "lucide-react";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EmptyState } from "./EmptyState";

// TanStack columns are intentionally value-variant; table callers mix accessor and display columns.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseColumnDef<T> = ColumnDef<T, any>;

export function DataTable<T>({
  data,
  columns,
  empty,
  stickyHeader = false,
}: {
  data: T[];
  columns: LooseColumnDef<T>[];
  empty: string;
  stickyHeader?: boolean;
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
    <div className="surface overflow-hidden">
      <div className="premium-scrollbar overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className={stickyHeader ? "sticky top-0 z-10 bg-muted/80 backdrop-blur" : "bg-muted/50"}>
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
                        {header.column.getCanSort() && (
                          <ArrowUpDown size={13} className="opacity-70" />
                        )}
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
                  className="transition-colors hover:bg-accent/45"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle text-foreground">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </motion.tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center"
                >
                  <div role="status">
                    <EmptyState
                      compact
                      icon={FileText}
                      title={empty}
                      description="Adjust filters or create a new record to populate this table."
                    />
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
