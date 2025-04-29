"use client"

import * as React from "react"
import { AlertCircle, CalendarIcon, Check } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

interface EconomicEvent {
  id: string
  title: string
  country: string
  date: string
  time: string
  actual?: string
  forecast?: string
  previous?: string
  impact: "high" | "medium" | "low"
}

// In a real app, this would be streamed from a WebSocket or SSE connection
const dummyEvents: EconomicEvent[] = [
  {
    id: "1",
    title: "Non-Farm Payrolls",
    country: "USD",
    date: "2024-02-07",
    time: "13:30",
    actual: "353K",
    forecast: "180K",
    previous: "216K",
    impact: "high",
  },
  {
    id: "2",
    title: "Interest Rate Decision",
    country: "EUR",
    date: "2024-02-07",
    time: "14:45",
    actual: "4.50%",
    forecast: "4.50%",
    previous: "4.50%",
    impact: "high",
  },
  {
    id: "3",
    title: "GDP Growth Rate QoQ",
    country: "GBP",
    date: "2024-02-07",
    time: "09:30",
    actual: "0.3%",
    forecast: "0.2%",
    previous: "0.2%",
    impact: "medium",
  },
  {
    id: "4",
    title: "Unemployment Rate",
    country: "JPY",
    date: "2024-02-07",
    time: "23:30",
    forecast: "2.5%",
    previous: "2.5%",
    impact: "medium",
  },
  {
    id: "5",
    title: "CPI YoY",
    country: "CNY",
    date: "2024-02-07",
    time: "01:30",
    actual: "0.2%",
    forecast: "0.4%",
    previous: "0.1%",
    impact: "high",
  },
]

const countries = [
  { value: "all", label: "All Countries" },
  { value: "USD", label: "United States" },
  { value: "EUR", label: "Eurozone" },
  { value: "JPY", label: "Japan" },
  { value: "GBP", label: "United Kingdom" },
  { value: "CNY", label: "China" },
  { value: "AUD", label: "Australia" },
  { value: "CAD", label: "Canada" },
  { value: "CHF", label: "Switzerland" },
]

function EventCard({ event }: { event: EconomicEvent }) {
  return (
    <div className="space-y-2 rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{event.country}</Badge>
          <h3 className="font-semibold leading-none tracking-tight">{event.title}</h3>
        </div>
        <Badge
          variant="secondary"
          className={cn(
            "capitalize",
            event.impact === "high" && "bg-red-500/10 text-red-500",
            event.impact === "medium" && "bg-yellow-500/10 text-yellow-500",
            event.impact === "low" && "bg-green-500/10 text-green-500",
          )}
        >
          {event.impact}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Previous</p>
          <p className="font-medium">{event.previous || "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Forecast</p>
          <p className="font-medium">{event.forecast || "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Actual</p>
          <p className="font-medium">{event.actual || "—"}</p>
        </div>
      </div>
      <div className="flex items-center justify-end text-xs text-muted-foreground">
        <time>{event.time}</time>
      </div>
    </div>
  )
}

export function CalendarFeed() {
  const [date, setDate] = React.useState<Date>()
  const [country, setCountry] = React.useState("all")
  const [open, setOpen] = React.useState(false)
  const [highPriorityOnly, setHighPriorityOnly] = React.useState(false)

  // In a real app, you would set up WebSocket or SSE here
  React.useEffect(() => {
    // Example SSE setup:
    // const eventSource = new EventSource('https://your-api/calendar-stream')
    // eventSource.onmessage = (event) => {
    //   const calendarEvent = JSON.parse(event.data)
    //   // Update events state
    // }
    // return () => eventSource.close()
  }, [])

  const filteredEvents = React.useMemo(() => {
    return dummyEvents.filter((event) => {
      const matchesDate = !date || event.date === format(date, "yyyy-MM-dd")
      const matchesCountry = country === "all" || event.country === country
      const matchesPriority = highPriorityOnly ? event.impact === "high" : true
      return matchesDate && matchesCountry && matchesPriority
    })
  }, [date, country, highPriorityOnly])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
          </PopoverContent>
        </Popover>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} className="w-[240px] justify-between">
              {countries.find((c) => c.value === country)?.label ?? "Select country..."}
              <Check className={cn("ml-2 h-4 w-4 opacity-50")} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0">
            <Command>
              <CommandInput placeholder="Search country..." />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {countries.map((c) => (
                    <CommandItem
                      key={c.value}
                      value={c.value}
                      onSelect={(currentValue) => {
                        setCountry(currentValue)
                        setOpen(false)
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", country === c.value ? "opacity-100" : "opacity-0")} />
                      {c.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <div className="flex items-center gap-2 ml-auto">
          <Switch checked={highPriorityOnly} onClick={() => setHighPriorityOnly(!highPriorityOnly)} />
          <span className="flex items-center text-sm">
            <AlertCircle className="mr-1 h-4 w-4 text-red-500" />
            High Priority
          </span>
        </div>
      </div>
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

