"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  type: z.enum(["initial", "deposit", "withdraw"]),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a valid positive number",
  }),
  date: z.date({
    required_error: "Please select a date",
  }),
  notes: z.string().optional(),
})

interface BalanceHistoryItem {
  id: number
  trade_id: number | null
  previous_balance: number
  change_amount: number
  new_balance: number
  type: "trade" | "transaction"
  date: string
  notes: string | null
  source_type: string
  description: string
}

export function TradingAccountsDialog() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [balance, setBalance] = React.useState(0)
  const [transactions, setTransactions] = React.useState<BalanceHistoryItem[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "deposit",
      amount: "",
      date: new Date(),
      notes: "",
    },
  })

  const fetchAccountData = React.useCallback(async () => {
    try {
      const response = await fetch("/api/accounts")
      const data = await response.json()
      if (data.success) {
        setBalance(data.balance)
        setTransactions(data.transactions)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Failed to fetch account data:", error)
      toast.error("Failed to fetch account data")
    }
  }, [])

  React.useEffect(() => {
    fetchAccountData()
  }, [fetchAccountData])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          amount: Number(values.amount),
          date: values.date.toISOString(),
        }),
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error)
      }

      toast.success("Transaction added successfully")
      form.reset()
      fetchAccountData()
    } catch (error) {
      console.error("Failed to add transaction:", error)
      toast.error("Failed to add transaction")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Trading Accounts</DialogTitle>
        <DialogDescription>Manage your trading capital. Current balance: ${balance.toLocaleString()}</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="initial">Initial Capital</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdraw">Withdraw</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Add any notes about this transaction" className="resize-none" {...field} />
                </FormControl>
                <FormDescription>Optional notes about this transaction.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Transaction
            </Button>
          </DialogFooter>
        </form>
      </Form>
      <div className="mt-6">
        <h4 className="mb-4 text-sm font-medium">Balance History</h4>
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
          {transactions.map((item: BalanceHistoryItem) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">{item.source_type}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString()}</p>
              </div>
              <div className="text-right space-y-1">
                <p className={cn("text-sm font-medium", item.change_amount < 0 ? "text-red-500" : "text-green-500")}>
                  {item.change_amount > 0 ? "+" : ""}${item.change_amount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Balance: ${item.new_balance.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DialogContent>
  )
}

