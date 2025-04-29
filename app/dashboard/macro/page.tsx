import { AppSidebar } from "@/components/app-sidebar"
import { TradingSessions } from "@/components/trading-sessions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { NewsFeed } from "@/components/macro/news-feed"
import { CalendarFeed } from "@/components/macro/calendar-feed"
import { EconomicData } from "@/components/macro/economic-data"

export default function MacroPage() {
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
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Market News</CardTitle>
              </CardHeader>
              <CardContent>
                <NewsFeed />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Economic Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarFeed />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Macro Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <EconomicData />
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

