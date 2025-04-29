import { AppSidebar } from "@/components/app-sidebar"
import { TradingSessions } from "@/components/trading-sessions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default function MicroPage() {
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
                <CardTitle>Volume Profile</CardTitle>
                <CardDescription>Price levels and volume distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/3] rounded-lg bg-muted" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Order Flow</CardTitle>
                <CardDescription>Real-time order book analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/3] rounded-lg bg-muted" />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Market Depth</CardTitle>
              <CardDescription>Detailed order book visualization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] rounded-lg bg-muted" />
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

