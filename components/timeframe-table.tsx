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
  pnlR: number
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
  wilcoxonPValue: number
}

const columns: ColumnDef<TradeMetrics>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const dateValue = row.getValue("date");
      if (!dateValue) return <div className="font-medium">—</div>;
      
      // Format the date string to YYYY-MM-DD
      const date = new Date(dateValue as string);
      const formattedDate = date.toISOString().split('T')[0];
      
      return <div className="font-medium">{formattedDate}</div>;
    },
  },
  {
    accessorKey: "nb",
    header: "# Trades",
  },
  {
    accessorKey: "profitR",
    header: "Profit R",
    cell: ({ row }) => {
      const value = row.getValue<number>("profitR")
      return <div className="text-right">{value?.toFixed(2) ?? "—"}</div>
    },
  },
  {
    accessorKey: "lossR",
    header: "Loss R",
    cell: ({ row }) => {
      const value = row.getValue<number>("Loss R")
      return <div className="text-right">{value?.toFixed(2) ?? "—"}</div>
    },
  },
  {
    accessorKey: "pnlR",
    header: "P&L R",
    cell: ({ row }) => {
      const value = row.getValue<number>("pnlR")
      return (
        <div className={`text-right ${value > 0 ? "text-green-500" : value < 0 ? "text-red-500" : ""}`}>
          {value?.toFixed(2) ?? "—"}
        </div>
      )
    },
  },
  {
    accessorKey: "ratioR",
    header: "Ratio R",
    cell: ({ row }) => {
      const value = row.getValue<number>("ratioR")
      return <div className="text-right">{value?.toFixed(2) ?? "—"}</div>
    },
  },
  {
    accessorKey: "gainRate",
    header: "Gain Rate",
    cell: ({ row }) => {
      const value = row.getValue<number>("gainRate")
      return <div className="text-right">{value?.toFixed(1) ?? "—"}%</div>
    },
  },
  {
    accessorKey: "hedge",
    header: "Hedge",
    cell: ({ row }) => {
      const value = row.getValue<number>("hedge") * 100
      return <div className="text-right">{value?.toFixed(1) ?? "—"}%</div>
    },
  },
  {
    accessorKey: "positiveHedge",
    header: "+Hedge",
    cell: ({ row }) => {
      const value = row.getValue<number>("positiveHedge") * 100
      return <div className="text-right">{value?.toFixed(1) ?? "—"}%</div>
    },
  },
  {
    accessorKey: "wr",
    header: "WR",
    cell: ({ row }) => {
      const value = row.getValue<number>("wr")
      return <div className="text-right">{value?.toFixed(1) ?? "—"}%</div>
    },
  },
  {
    accessorKey: "risk",
    header: "~Risk",
    cell: ({ row }) => {
      const rawRisk = row.getValue<number>("risk");
      
      const value = rawRisk && rawRisk < 1 ? rawRisk * 100 : null;
      
      return <div className="text-right">{value?.toFixed(2) ?? "—"}%</div>
    },
  },
  {
    accessorKey: "Q1 Return",
    header: "Q1 Return",
    cell: ({ row }) => {
      const value = row.getValue<number>("Q1 Return")
      return <div className="text-right">{value?.toFixed(1) ?? "—"}%</div>
    },
  },
  {
    accessorKey: "Q2 Return",
    header: "Q2 Return",
    cell: ({ row }) => {
      const value = row.getValue<number>("Q2 Return")
      return <div className="text-right">{value?.toFixed(1) ?? "—"}%</div>
    },
  },
  {
    accessorKey: "Q3 Return",
    header: "Q3 Return",
    cell: ({ row }) => {
      const value = row.getValue<number>("Q3 Return")
      return <div className="text-right">{value?.toFixed(1) ?? "—"}%</div>
    },
  },
  {
    accessorKey: "Q4 Return",
    header: "Q4 Return",
    cell: ({ row }) => {
      const value = row.getValue<number>("Q4 Return")
      return <div className="text-right">{value?.toFixed(1) ?? "—"}%</div>
    },
  },
  {
    accessorKey: "flatPercent",
    header: "Flat %",
    cell: ({ row }) => {
      const value = row.getValue<number>("flatPercent")
      return <div className="text-right">{value?.toFixed(1) ?? "—"}%</div>
    },
  },
  {
    accessorKey: "gainPercent",
    header: "Gain %",
    cell: ({ row }) => {
      const value = row.getValue<number>("gainPercent")
      return <div className="text-right">{value?.toFixed(1) ?? "—"}%</div>
    },
  },
  {
    accessorKey: "lossPercent",
    header: "Loss %",
    cell: ({ row }) => {
      const value = row.getValue<number>("lossPercent")
      return <div className="text-right">{value?.toFixed(1) ?? "—"}%</div>
    },
  },
  {
    accessorKey: "capitalChange",
    header: "AUM Chg",
    cell: ({ row }) => {
      const value = row.getValue<number>("capitalChange")
      if (!value) return <div className="text-right">—</div>
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
    header: "AUM",
    cell: ({ row }) => {
      const value = row.getValue<number>("capitalEndPeriod")
      if (!value) return <div className="text-right">—</div>
      return <div className="text-right">{value.toLocaleString("en-US", { style: "currency", currency: "USD" })}</div>
    },
  },
  {
    accessorKey: "compoundReturn",
    header: "Return %",
    cell: ({ row }) => {
      const value = row.getValue<number>("compoundReturn")
      if (!value) return <div className="text-right">—</div>
      return (
        <div className={`text-right ${value > 0 ? "text-green-500" : value < 0 ? "text-red-500" : ""}`}>
          {value.toFixed(1)}%
        </div>
      )
    },
  },
  {
    accessorKey: "ddEnd",
    header: "DD",
    cell: ({ row }) => {
      const value = row.getValue<number>("ddEnd")
      return <div className="text-right">{value?.toFixed(1) ?? "—"}%</div>
    },
  },
  {
    accessorKey: "mddPeriod",
    header: "MDD",
    cell: ({ row }) => {
      const value = row.getValue<number>("mddPeriod") * 100
      return <div className="text-right">{value?.toFixed(1) ?? "—"}%</div>
    },
  },
  {
    accessorKey: "returnPerTrade",
    header: "~R/Trade", // Changed from "Return Per Trade"
    cell: ({ row }) => {
      const value = row.getValue<number>("returnPerTrade")
      return <div className="text-right">{value?.toFixed(2) ?? "—"}</div>
    },
  },
  {
    accessorKey: "wilcoxonPValue",
    header: "Pvalue",
    cell: ({ row }) => {
      const pValue = row.getValue<number>("wilcoxonPValue")
      
      // Determine significance level for styling
      let significance = "";
      if (pValue !== undefined && pValue !== null) {
        if (pValue < 0.01) significance = "text-red-500 font-bold"; // Highly significant
        else if (pValue < 0.05) significance = "text-orange-500 font-semibold"; // Significant
        else if (pValue < 0.1) significance = "text-yellow-500"; // Marginally significant
      }
      
      return (
        <div className={`text-right ${significance}`}>
          {pValue !== undefined && pValue !== null ? pValue.toFixed(3) : "—"}
        </div>
      )
    },
    enableHiding: true,
  },
  {
    accessorKey: "ulcerIndex",
    header: "Ulcer Index",
    cell: ({ row }) => {
      const value = row.getValue<number>("ulcerIndex")
      return <div className="text-right">{value?.toFixed(2) ?? "—"}</div>
    },
  },
  {
    accessorKey: "upi",
    header: "UPI",
    cell: ({ row }) => {
      const value = row.getValue<number>("upi")
      return <div className="text-right">{value?.toFixed(2) ?? "—"}</div>
    },
  },
]

const columnDisplayNames: Record<string, string> = {
  profitR: "Profit R",
  lossR: "Loss R",
  pnlR: "P&L R",
  ratioR: "Ratio R",
  gainRate: "Gain Rate",
  wr: "WR",
  flatPercent: "Flat %",
  gainPercent: "Gain %",
  lossPercent: "Loss %",
  capitalChange: "AUM Chg",
  capitalEndPeriod: "AUM",
  compoundReturn: "Return %",
  ddEnd: "DD",
  mddPeriod: "MDD",
  returnPerTrade: "~R/Trade",
  wilcoxonPValue: "Pvalue",
  ulcerIndex: "Ulcer Index",
  upi: "UPI",
}

export function TimeframeTable({ data, loading = false }: { data?: any; loading?: boolean }) {
  const [timeframe, setTimeframe] = React.useState<TimeFrame>("monthly")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    date: true,
    nb: true,
    pnlR: true,
    gainRate: true,
    hedge: true,
    positiveHedge: true,
    wr: true,
    risk: true,
    flatPercent: true,
    capitalChange: true,
    capitalEndPeriod: true,
    compoundReturn: true,
    mddPeriod: true,
    returnPerTrade: true,
    wilcoxonPValue: true,
    upi: true,
    profitR: false,
    lossR: false,
    ratioR: false,
    posTrades: false,
    negTrades: false,
    "Q1 Return": false,
    "Q2 Return": false,
    "Q3 Return": false,
    "Q4 Return": false,
    gainPercent: false,
    lossPercent: false,
    ddEnd: false,
  })
  const [rowSelection, setRowSelection] = React.useState({})

  const dataMemo = React.useMemo(() => {
    if (loading) {
      return []
    }
    
    if (data) {
      return data[timeframe] || []
    }
    
    return [] // Return empty array instead of dummy data
  }, [timeframe, data, loading])

  const table = useReactTable({
    data: dataMemo,
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

  // Return loading state if loading
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Performance Clustering</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Return empty state if no data
  if (!data || !data[timeframe] || data[timeframe].length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Performance Clustering</CardTitle>
          <Tabs value={timeframe} onValueChange={(value: string) => setTimeframe(value as TimeFrame)}>
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
              <TabsTrigger value="annually">Annually</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No data available for this timeframe
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Performance Clustering</CardTitle>
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
              <DropdownMenuContent
                align="end"
                className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-lg scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
              >
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
                        {columnDisplayNames[column.id] || column.id}
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
                      <TableHead key={header.id} className={header.id !== "date" ? "text-right" : undefined}>
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

