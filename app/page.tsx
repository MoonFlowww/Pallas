import { AppSidebar } from "@/components/app-sidebar"
import { TradingSessions } from "@/components/trading-sessions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { CrossRateChange } from "@/components/dashboard/cross-rate-change"
import { CompactEquityCurve } from "@/components/dashboard/compact-equity-curve"
import { MarketAnalysis } from "@/components/dashboard/market-analysis"

export default function DashboardPage() {
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
          <div className="grid gap-4 md:grid-cols-[1.5fr,1fr]">
            <Card className="min-h-[150px]">
              <CardHeader>
                <CardTitle>Cross Rate Change</CardTitle>
                <CardDescription>Real-time cross rate movements</CardDescription>
              </CardHeader>
              <CardContent>
                <CrossRateChange />
              </CardContent>
            </Card>
            <Card className="min-h-[150px]">
              <CardHeader>
                <CardTitle>Equity Curve</CardTitle>
                <CardDescription>Performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <CompactEquityCurve />
              </CardContent>
            </Card>
          </div>
          <Card className="min-h-[300px]">
            <CardHeader>
              <CardTitle>Market Analysis</CardTitle>
              <CardDescription>Detailed market insights and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <MarketAnalysis />
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

