"use client"

import * as React from "react"
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
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TimeFrame = "daily" | "weekly" | "monthly" | "quarterly" | "annually"

interface TradeMetrics {
  date: string
  nb: number
  profitR: number
  lossR: number
  plR: number
  ratioR: number
  posTrades: number
  negTrades: number
  ordersWinRate: number
  gainHedge: number
  hedgePosTrades: number
  wr: number
  avgWeightedRisk: number
  q1Return: number
  q2Return: number
  q3Return: number
  q4Return: number
  flatPercent: number
  gainPercent: number
  lossPercent: number
  capitalChange: number
  capitalEndPeriod: number
  compoundReturn: number
  ddEnd: number
  mddPeriod: number
  returnPerTrade: number
  ulcerIndex: number
  upi: number
}

const columns: ColumnDef<TradeMetrics>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <div className="font-medium">{row.getValue("date")}</div>,
  },
  {
    accessorKey: "nb",
    header: "# Trades",
  },
  {
    accessorKey: "profitR",
    header: "Profit R",
    cell: ({ row }) => <div className="text-right">{row.getValue<number>("profitR").toFixed(2)}</div>,
  },
  {
    accessorKey: "lossR",
    header: "Loss R",
    cell: ({ row }) => <div className="text-right">{row.getValue<number>("lossR").toFixed(2)}</div>,
  },
  {
    accessorKey: "plR",
    header: "P&L R",
    cell: ({ row }) => {
      const value = row.getValue<number>("plR")
      return (
        <div className={`text-right ${value > 0 ? "text-green-500" : value < 0 ? "text-red-500" : ""}`}>
          {value.toFixed(2)}
        </div>
      )
    },
  },
  {
    accessorKey: "ratioR",
    header: "Ratio R",
    cell: ({ row }) => <div className="text-right">{row.getValue<number>("ratioR").toFixed(2)}</div>,
  },
  {
    accessorKey: "posTrades",
    header: "Pos Trades",
  },
  {
    accessorKey: "negTrades",
    header: "Neg Trades",
  },
  {
    accessorKey: "ordersWinRate",
    header: "Orders Win %",
    cell: ({ row }) => <div className="text-right">{row.getValue<number>("ordersWinRate").toFixed(1)}%</div>,
  },
  {
    accessorKey: "gainHedge",
    header: "Gain Hedge",
    cell: ({ row }) => <div className="text-right">{row.getValue<number>("gainHedge").toFixed(2)}</div>,
  },
  {
    accessorKey: "hedgePosTrades",
    header: "Hedge Pos",
    cell: ({ row }) => <div className="text-right">{row.getValue<number>("hedgePosTrades").toFixed(2)}</div>,
  },
  {
    accessorKey: "wr",
    header: "WR",
    cell: ({ row }) => <div className="text-right">{row.getValue<number>("wr").toFixed(1)}%</div>,
  },
  {
    accessorKey: "avgWeightedRisk",
    header: "Avg W.Risk",
    cell: ({ row }) => <div className="text-right">{row.getValue<number>("avgWeightedRisk").toFixed(2)}</div>,
  },
  {
    accessorKey: "quarterlyReturns",
    header: "Q1|Q2|Q3|Q4",
    cell: ({ row }) => (
      <div className="text-right">
        {row.getValue<number>("q1Return").toFixed(1)}% | {row.getValue<number>("q2Return").toFixed(1)}% |{" "}
        {row.getValue<number>("q3Return").toFixed(1)}% | {row.getValue<number>("q4Return").toFixed(1)}%
      </div>
    ),
  },
  {
    accessorKey: "flatPercent",
    header: "Flat %",
    cell: ({ row }) => <div className="text-right">{row.getValue<number>("flatPercent").toFixed(1)}%</div>,
  },
  {
    accessorKey: "gainPercent",
    header: "Gain %",
    cell: ({ row }) => <div className="text-right">{row.getValue<number>("gainPercent").toFixed(1)}%</div>,
  },
  {
    accessorKey: "lossPercent",
    header: "Loss %",
    cell: ({ row }) => <div className="text-right">{row.getValue<number>("lossPercent").toFixed(1)}%</div>,
  },
  {
    accessorKey: "capitalChange",
    header: "Capital +/-",
    cell: ({ row }) => {
      const value = row.getValue<number>("capitalChange")
      return (
        <div className={`text-right ${value > 0 ? "text-green-500" : value < 0 ? "text-red-500" : ""}`}>
          {value > 0 ? "+" : ""}
          {value.toLocaleString("en-US", { style: "currency", currency: "USD" })}
        </div>
      )
    },
  },
  {
    accessorKey: "capitalEndPeriod",
    header: "End Capital",
    cell: ({ row }) => (
      <div className="text-right">
        {row.getValue<number>("capitalEndPeriod").toLocaleString("en-US", { style: "currency", currency: "USD" })}
      </div>
    ),
  },
  {
    accessorKey: "compoundReturn",
    header: "Compound %",
    cell: ({ row }) => {
      const value = row.getValue<number>("compoundReturn")
      return (
        <div className={`text-right ${value > 0 ? "text-green-500" : value < 0 ? "text-red-500" : ""}`}>
          {value.toFixed(1)}%
        </div>
      )
    },
  },
  {
    accessorKey: "ddEnd",
    header: "DD End",
    cell: ({ row }) => <div className="text-right">{row.getValue<number>("ddEnd").toFixed(1)}%</div>,
  },
  {
    accessorKey: "mddPeriod",
    header: "MDD Period",
    cell: ({ row }) => <div className="text-right">{row.getValue<number>("mddPeriod").toFixed(1)}%</div>,
  },
  {
    accessorKey: "returnPerTrade",
    header: "Return/Trade",
    cell: ({ row }) => <div className="text-right">{row.getValue<number>("returnPerTrade").toFixed(2)}</div>,
  },
  {
    accessorKey: "ulcerIndex",
    header: "Ulcer Index",
    cell: ({ row }) => <div className="text-right">{row.getValue<number>("ulcerIndex").toFixed(2)}</div>,
  },
  {
    accessorKey: "upi",
    header: "UPI",
    cell: ({ row }) => <div className="text-right">{row.getValue<number>("upi").toFixed(2)}</div>,
  },
]



export function TimeframeTable() {
  const [timeframe, setTimeframe] = React.useState<TimeFrame>("monthly")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [loading, setLoading] = React.useState(true)
  const [externalData, setExternalData] = React.useState<Record<TimeFrame, TradeMetrics[]>>({
    daily: [],
    weekly: [],
    monthly: [],
    quarterly: [],
    annually: []
  })

  // Use external data if provided, otherwise fall back to sample data
  const data = React.useMemo(() => {
    if (loading) {
      return []
    }
    
    if (externalData) {
      return externalData[timeframe] || []
    }
    
    return [] // Return empty array instead of dummy data
  }, [timeframe, externalData, loading])

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
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Performance by Timeframe</CardTitle>
          <div className="flex items-center gap-4">
            <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as TimeFrame)}>
              <TabsList>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                <TabsTrigger value="annually">Annually</TabsTrigger>
              </TabsList>
            </Tabs>
            <Input
              placeholder="Filter dates..."
              value={(table.getColumn("date")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("date")?.setFilterValue(event.target.value)}
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

