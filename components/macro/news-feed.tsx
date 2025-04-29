"use client"

import * as React from "react"
import { Search, AlertCircle } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

interface NewsItem {
  id: string
  category: "forex" | "stocks" | "crypto" | "commodities" | "economy"
  title: string
  summary: string
  source: string
  timestamp: string
  impact: "high" | "medium" | "low"
  sentiment?: "positive" | "negative" | "neutral"
}

// In a real app, this would be streamed from a WebSocket or SSE connection
const dummyNews: NewsItem[] = [
  {
    id: "1",
    category: "forex",
    title: "EUR/USD Surges After ECB Comments on Rate Path",
    summary:
      "The euro strengthened against the dollar following hawkish comments from ECB officials regarding the future path of interest rates.",
    source: "Financial Times",
    timestamp: "2024-02-07T14:30:00Z",
    impact: "high",
    sentiment: "positive",
  },
  {
    id: "2",
    category: "economy",
    title: "US Job Market Shows Resilience in Latest Report",
    summary:
      "Non-farm payrolls exceeded expectations, pointing to continued strength in the US labor market despite monetary tightening.",
    source: "Bloomberg",
    timestamp: "2024-02-07T13:15:00Z",
    impact: "high",
    sentiment: "positive",
  },
  {
    id: "3",
    category: "stocks",
    title: "Tech Stocks Lead Market Decline Amid Valuation Concerns",
    summary: "Major technology shares faced selling pressure as investors reassess growth expectations and valuations.",
    source: "Reuters",
    timestamp: "2024-02-07T11:45:00Z",
    impact: "medium",
    sentiment: "negative",
  },
  {
    id: "4",
    category: "commodities",
    title: "Gold Prices Rally on Safe-Haven Demand",
    summary: "Precious metals gained as geopolitical tensions and inflation concerns drive safe-haven flows.",
    source: "MarketWatch",
    timestamp: "2024-02-07T10:20:00Z",
    impact: "medium",
    sentiment: "positive",
  },
  {
    id: "5",
    category: "crypto",
    title: "Bitcoin ETF Trading Volume Hits New Record",
    summary:
      "Spot Bitcoin ETFs continue to see strong investor interest with daily trading volumes reaching new highs.",
    source: "CoinDesk",
    timestamp: "2024-02-07T09:00:00Z",
    impact: "high",
    sentiment: "positive",
  },
]

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <div className="space-y-2 rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-semibold leading-none tracking-tight">{item.title}</h3>
        <Badge
          variant="secondary"
          className={cn(
            "capitalize",
            item.sentiment === "positive" && "bg-green-500/10 text-green-500",
            item.sentiment === "negative" && "bg-red-500/10 text-red-500",
            item.sentiment === "neutral" && "bg-yellow-500/10 text-yellow-500",
          )}
        >
          {item.sentiment}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{item.summary}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>{item.source}</span>
          <Badge
            variant="secondary"
            className={cn(
              "capitalize",
              item.impact === "high" && "bg-red-500/10 text-red-500",
              item.impact === "medium" && "bg-yellow-500/10 text-yellow-500",
              item.impact === "low" && "bg-green-500/10 text-green-500",
            )}
          >
            {item.impact}
          </Badge>
        </div>
        <time dateTime={item.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
    </div>
  )
}

export function NewsFeed() {
  const [search, setSearch] = React.useState("")
  const [activeTab, setActiveTab] = React.useState<string>("all")
  const [highPriorityOnly, setHighPriorityOnly] = React.useState(false)

  // In a real app, you would set up WebSocket or SSE here
  React.useEffect(() => {
    // Example WebSocket setup:
    // const ws = new WebSocket('wss://your-api/news-stream')
    // ws.onmessage = (event) => {
    //   const news = JSON.parse(event.data)
    //   // Update news state
    // }
    // return () => ws.close()
  }, [])

  const filteredNews = React.useMemo(() => {
    return dummyNews.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.summary.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = activeTab === "all" || item.category === activeTab
      const matchesPriority = highPriorityOnly ? item.impact === "high" : true
      return matchesSearch && matchesCategory && matchesPriority
    })
  }, [search, activeTab, highPriorityOnly])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={highPriorityOnly} onClick={() => setHighPriorityOnly(!highPriorityOnly)} />
          <span className="flex items-center text-sm">
            <AlertCircle className="mr-1 h-4 w-4 text-red-500" />
            High Priority
          </span>
        </div>
      </div>
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="forex">Forex</TabsTrigger>
          <TabsTrigger value="stocks">Stocks</TabsTrigger>
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
          <TabsTrigger value="commodities">Commodities</TabsTrigger>
          <TabsTrigger value="economy">Economy</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {filteredNews.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

