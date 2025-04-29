"use client"

import { useEffect, useState } from "react"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { AppSidebar } from "@/components/app-sidebar"
import { TradingSessions } from "@/components/trading-sessions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { ErrorBoundary } from "@/components/error-boundary"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTradeData } from '@/lib/cache/TradeDataProvider'

interface Trade {
  id: number
  type: string
  date: string
  asset: string
  biais: string
  entry_price: number
  exit_price: number | null
  rr: number | null
  r: number | null
  hedge: number | null
  risk: number | null
  state: string | null
  result: number | null
  mdd: number | null
  calmar: number | null
  upi: number | null
  screenshot: string | null
  live: boolean | null
}

// Update type guard to match new interface
function isTrade(obj: any): obj is Trade {
  const validationErrors: string[] = []

  if (!obj) validationErrors.push("Trade object is null or undefined")
  else {
    if (typeof obj.id !== "number") validationErrors.push(`Invalid id: ${obj.id}`)
    if (typeof obj.date !== "string") validationErrors.push(`Invalid date: ${obj.date}`)
    if (typeof obj.asset !== "string") validationErrors.push(`Invalid asset: ${obj.asset}`)
    if (typeof obj.biais !== "string") validationErrors.push(`Invalid biais: ${obj.biais}`)

    // Handle entry_price as either number or string
    if (typeof obj.entry_price === "string") {
      obj.entry_price = Number.parseFloat(obj.entry_price)
    }
    if (typeof obj.entry_price !== "number" || isNaN(obj.entry_price)) {
      validationErrors.push(`Invalid entry_price: ${obj.entry_price}`)
    }

    // Handle optional numeric fields
    if (obj.exit_price !== null) {
      obj.exit_price = typeof obj.exit_price === "string" ? Number.parseFloat(obj.exit_price) : obj.exit_price
    }
    if (obj.rr !== null) {
      obj.rr = typeof obj.rr === "string" ? Number.parseFloat(obj.rr) : obj.rr
    }
    if (obj.r !== null) {
      obj.r = typeof obj.r === "string" ? Number.parseFloat(obj.r) : obj.r
    }
    if (obj.hedge !== null) {
      obj.hedge = typeof obj.hedge === "string" ? Number.parseFloat(obj.hedge) : obj.hedge
    }
    if (obj.risk !== null) {
      obj.risk = typeof obj.risk === "string" ? Number.parseFloat(obj.risk) : obj.risk
    }
    if (obj.result !== null) {
      obj.result = typeof obj.result === "string" ? Number.parseFloat(obj.result) : obj.result
    }
    if (obj.mdd !== null) {
      obj.mdd = typeof obj.mdd === "string" ? Number.parseFloat(obj.mdd) : obj.mdd
    }
    if (obj.calmar !== null) {
      obj.calmar = typeof obj.calmar === "string" ? Number.parseFloat(obj.calmar) : obj.calmar
    }
    if (obj.upi !== null) {
      obj.upi = typeof obj.upi === "string" ? Number.parseFloat(obj.upi) : obj.upi
    }
    // Handle live boolean
    if (obj.live !== null && typeof obj.live !== "boolean") {
      obj.live = obj.live === true || obj.live === "true" || obj.live === 1
    }
  }

  if (validationErrors.length > 0) {
    console.error("Trade validation failed:", {
      trade: obj,
      errors: validationErrors,
    })
    return false
  }

  return true
}

// Safe accessor function for cell values
function getCellValue<T>(row: { getValue: (key: string) => unknown }, key: string, defaultValue: T): T {
  try {
    const value = row.getValue(key)
    return value === null || value === undefined ? defaultValue : value as T
  } catch (error) {
    console.error(`Error accessing cell value for key ${key}:`, error)
    return defaultValue
  }
}

// Update columns definition to match new interface
const columns: ColumnDef<Trade>[] = [
  {
    accessorKey: "state",
    header: "Status",
    cell: ({ row }) => {
      const state = getCellValue<string | null>(row, "state", null)
      return (
        <div className="flex items-center">
          {state === "open" ? (
            <div className="h-2 w-2 rounded-full bg-green-500" title="Open Position" />
          ) : (
            <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center" title="Closed Position">
              <svg
                className="h-3 w-3 text-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      try {
        const date = getCellValue<string>(row, "date", "")
        return date ? new Date(date).toLocaleString() : "—"
      } catch (error) {
        return "—"
      }
    },
  },
  {
    accessorKey: "asset",
    header: "Asset",
    cell: ({ row }) => getCellValue<string>(row, "asset", "—"),
  },
  {
    accessorKey: "biais",
    header: "Bias",
    cell: ({ row }) => {
      const biais = getCellValue<string>(row, "biais", "")
      const isLong = biais.toLowerCase() === "long"
      return (
        <div className="flex items-center">
          {isLong ? (
            <ArrowUpIcon className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <ArrowDownIcon className="mr-2 h-4 w-4 text-red-500" />
          )}
          {biais}
        </div>
      )
    },
  },
  {
    accessorKey: "entry_price",
    header: "Entry",
    cell: ({ row }) => {
      const value = getCellValue<number | null>(row, "entry_price", null)
      return value !== null ? value.toFixed(5) : "—"
    },
  },
  {
    accessorKey: "exit_price",
    header: "Exit",
    cell: ({ row }) => {
      const value = getCellValue<number | null>(row, "exit_price", null)
      return value !== null ? value.toFixed(5) : "—"
    },
  },
  {
    accessorKey: "rr",
    header: "R:R",
    cell: ({ row }) => {
      const value = getCellValue<number | null>(row, "rr", null)
      return value !== null ? value.toFixed(2) : "—"
    },
  },
  {
    accessorKey: "hedge",
    header: "Hedge",
    cell: ({ row }) => {
      const value = getCellValue<number | null>(row, "hedge", null)
      return value !== null ? `${value.toFixed(2)}%` : "—"
    },
  },
  {
    accessorKey: "result",
    header: "Return %",
    cell: ({ row }) => {
      const value = getCellValue<number | null>(row, "result", null)
      if (value === null) return "—"
      const percentageValue = value * 100
      return (
        <span className={cn("font-medium", percentageValue > 0 ? "text-green-500" : percentageValue < 0 ? "text-red-500" : "")}>
          {percentageValue.toFixed(2)}%
        </span>
      )
    },
  },
  {
    accessorKey: "mdd",
    header: "MDD",
    cell: ({ row }) => {
      const value = getCellValue<number | null>(row, "mdd", null)
      return value !== null ? `${value.toFixed(2)}%` : "—"
    },
  },
  {
    accessorKey: "calmar",
    header: "Calmar",
    cell: ({ row }) => {
      const value = getCellValue<number | null>(row, "calmar", null)
      return value !== null ? value.toFixed(2) : "—"
    },
  },
  {
    accessorKey: "upi",
    header: "UPI",
    cell: ({ row }) => {
      const value = getCellValue<number | null>(row, "upi", null)
      return value !== null ? value.toFixed(2) : "—"
    },
  },
  {
    accessorKey: "screenshot",
    header: "Screenshot",
    cell: ({ row }) => {
      const screenshot = getCellValue<string | null>(row, "screenshot", null)
      return screenshot ? (
        <a href={screenshot} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          View
        </a>
      ) : "—"
    },
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => getCellValue<number>(row, "id", 0),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => getCellValue<string>(row, "type", "—"),
  },
  {
    accessorKey: "live",
    header: "Live",
    cell: ({ row }) => {
      const live = getCellValue<boolean | null>(row, "live", null)
      return live === true ? (
        <div className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
          <span>Live</span>
        </div>
      ) : "—"
    },
  },
]

function TableComponent({ data }: { data: Trade[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: true,
    type: true,
    date: true,
    asset: true,
    biais: true,
    entry_price: true,
    exit_price: true,
    rr: true,
    hedge: true,
    state: true,
    result: true,
    mdd: true,
    calmar: true,
    upi: true,
    screenshot: true,
    live: true
  })

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  return (
    <>
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filter assets..."
          value={(table.getColumn("asset")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("asset")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Columns</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No positions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

export default function DataPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedType, setSelectedType] = useState<"REAL" | "PAPER" | "ALL">("ALL") // Default to ALL to show all trades
  
  const { useTradesData } = useTradeData()
  const { data, isLoading, error } = useTradesData(selectedType, currentPage)
  
  // Add error handling and default values
  const trades = data?.trades || []
  const totalCount = data?.totalCount || 0
  const totalPages = data?.totalPages || 1
  
  useEffect(() => {
    console.log("Data page mounted with type:", selectedType)
    console.log("Fetched data:", data)
    
    if (error) {
      console.error("Error fetching trades:", error)
      toast.error("Error loading trades", {
        description: error.message || "Unknown error"
      })
    }
  }, [data, error, selectedType])
  
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleTypeChange = (type: "REAL" | "PAPER" | "ALL") => {
    console.log("Changing type to:", type)
    setSelectedType(type)
    setCurrentPage(1) // Reset to first page when changing type
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6">
          <SidebarTrigger className="-ml-2" />
          <div className="pr-4">
            <TradingSessions />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <Tabs value={selectedType} onValueChange={(value: string) => handleTypeChange(value as "REAL" | "PAPER" | "ALL")}>
              <TabsList>
                <TabsTrigger value="REAL" className="min-w-24">
                  Real
                </TabsTrigger>
                <TabsTrigger value="PAPER" className="min-w-24">
                  Paper
                </TabsTrigger>
                <TabsTrigger value="ALL" className="min-w-24">
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <ErrorBoundary>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Positions</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Total Trades:</span>
                      <span className="font-medium">{totalCount}</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">
                    Error loading trades: {error.message || "Unknown error"}
                  </div>
                ) : trades.length > 0 ? (
                  <TableComponent data={trades} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No trades found. Try selecting a different type or check your database connection.
                    <div className="mt-4 text-xs text-gray-500">
                      Debug info: Type={selectedType}, Page={currentPage}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </ErrorBoundary>
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

