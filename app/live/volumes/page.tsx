import { AppSidebar } from "@/components/app-sidebar"
import { TradingSessions } from "@/components/trading-sessions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default function LiveVolumesPage() {
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
                <CardTitle>Volume Analysis</CardTitle>
                <CardDescription>Real-time volume tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-lg bg-muted" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Volume Alerts</CardTitle>
                <CardDescription>Unusual volume detection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-lg bg-muted" />
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Buy Volume</CardTitle>
                <CardDescription>Buying pressure analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/3] rounded-lg bg-muted" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Sell Volume</CardTitle>
                <CardDescription>Selling pressure analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/3] rounded-lg bg-muted" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Net Volume</CardTitle>
                <CardDescription>Volume delta analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/3] rounded-lg bg-muted" />
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

