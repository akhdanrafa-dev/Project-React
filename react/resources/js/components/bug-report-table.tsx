import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type BugReport = {
  id: string
  username: string
  email: string
  phone: string
  date: string
  ticketNumber: string
  severity: "Low" | "Medium" | "High" | "Critical"
  handledBy: string
}

const columns: ColumnDef<BugReport>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("id")}</div>
    ),
  },
  {
    accessorKey: "username",
    header: "Username",
    cell: ({ row }) => (
      <div>{row.getValue("username")}</div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.getValue("email")}</div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Nomor Telepon",
    cell: ({ row }) => (
      <div>{row.getValue("phone")}</div>
    ),
  },
  {
    accessorKey: "date",
    header: "Tanggal",
    cell: ({ row }) => (
      <div>{row.getValue("date")}</div>
    ),
  },
  {
    accessorKey: "ticketNumber",
    header: "Nomor Tiket Antrian",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("ticketNumber")}</div>
    ),
  },
  {
    accessorKey: "severity",
    header: "Tingkat Kesulitan",
    cell: ({ row }) => {
      const severity = row.getValue("severity") as string
      const severityColors = {
        Low: "bg-blue-100 text-blue-800",
        Medium: "bg-yellow-100 text-yellow-800",
        High: "bg-orange-100 text-orange-800",
        Critical: "bg-red-100 text-red-800",
      }
      return (
        <Badge variant="outline" className={severityColors[severity as keyof typeof severityColors]}>
          {severity}
        </Badge>
      )
    },
  },
  {
    accessorKey: "handledBy",
    header: "Handle By",
    cell: ({ row }) => {
      const handledBy = row.getValue("handledBy") as string
      const isUnhandled = handledBy === "" || handledBy === "Belum Ditangani"
      return (
        <Badge variant={isUnhandled ? "secondary" : "default"}>
          {isUnhandled ? "Belum Ditangani" : handledBy}
        </Badge>
      )
    },
  },
]

export function BugReportTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [data, setData] = React.useState<BugReport[]>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div className="w-full px-4 lg:px-6">
      <div className="space-y-4">
        {/* Filter Section */}
        <div className="flex gap-2 flex-col sm:flex-row">
          <Input
            placeholder="Cari username atau email..."
            value={(table.getColumn("username")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("username")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>

        {/* Table Section */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
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
                    className="h-24 text-center text-muted-foreground"
                  >
                    Belum ada laporan bug
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Section */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Menampilkan {table.getRowModel().rows.length} dari {data.length} laporan
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.firstPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.lastPage()}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
