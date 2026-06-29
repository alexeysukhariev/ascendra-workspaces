'use client';

// ✍ StrategiClear — Alexey Sukhariev <alexey.sukhariev@gmail.com>

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Returns a comparable value to enable sorting on this column. */
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'right';
}

type SortDir = 'asc' | 'desc';

/**
 * Small generic, accessible, client-sortable table. Filtering/search is the
 * caller's responsibility (pass already-filtered `data`); sorting is handled
 * here with proper `aria-sort` and keyboard-operable header buttons.
 */
export function DataTable<T>({
  columns,
  data,
  getRowKey,
  initialSort,
  rowClassName,
  emptyState,
}: {
  columns: Column<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  initialSort?: { columnId: string; dir: SortDir };
  rowClassName?: (row: T) => string | undefined;
  emptyState?: React.ReactNode;
}) {
  const [sort, setSort] = useState<{ columnId: string; dir: SortDir } | null>(
    initialSort ?? null,
  );

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.id === sort.columnId);
    if (!col?.sortValue) return data;
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return -1 * factor;
      if (av > bv) return 1 * factor;
      return 0;
    });
  }, [data, sort, columns]);

  function toggleSort(columnId: string) {
    setSort((prev) => {
      if (prev?.columnId !== columnId) return { columnId, dir: 'asc' };
      if (prev.dir === 'asc') return { columnId, dir: 'desc' };
      return null;
    });
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => {
              const isSorted = sort?.columnId === col.id;
              const ariaSort = isSorted
                ? sort!.dir === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none';
              return (
                <TableHead
                  key={col.id}
                  aria-sort={col.sortValue ? ariaSort : undefined}
                  className={cn(
                    col.align === 'right' && 'text-right',
                    col.headerClassName,
                  )}
                >
                  {col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.id)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded font-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        col.align === 'right' && 'flex-row-reverse',
                      )}
                    >
                      {col.header}
                      {isSorted ? (
                        sort!.dir === 'asc' ? (
                          <ArrowUp className="size-3.5" />
                        ) : (
                          <ArrowDown className="size-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3.5 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="h-32 text-center text-sm text-muted-foreground"
              >
                {emptyState ?? 'No results.'}
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((row) => (
              <TableRow key={getRowKey(row)} className={rowClassName?.(row)}>
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    className={cn(
                      col.align === 'right' && 'text-right',
                      col.className,
                    )}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
