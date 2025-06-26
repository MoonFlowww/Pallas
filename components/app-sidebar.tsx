"use client"

import * as React from "react"
import {
  BarChart3,
  Bitcoin,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Gem,
  LineChart,
  LogOut,
  Search,
  Settings,
  TrendingUp,
  User2,
} from "lucide-react"

import { NavMain } from "./nav-main"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter, // Import SidebarFooter
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { ThemeSwitcher } from "./theme-switcher"
import { Check } from "lucide-react"
import { DialogTrigger, Dialog } from "@/components/ui/dialog"
import { SettingsDialog } from "./settings-dialog"
import { TradingAccountsDialog } from "./trading-accounts-dialog" // Import TradingAccountsDialog

const assetTypeIcons = {
  Forex: LineChart,
  Index: BarChart3,
  Commodity: Gem,
  Crypto: Bitcoin,
  Stock: TrendingUp,
  Custom: LineChart, // Default icon for custom assets
} as const

type AssetType = keyof typeof assetTypeIcons



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [assets, setAssets] = React.useState<{ name: string; type: AssetType; table: string }[]>([])
  const [selectedAsset, setSelectedAsset] = React.useState<{ name: string; type: AssetType; table: string } | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [settingsOpen, setSettingsOpen] = React.useState(false)

  const loadMarkets = React.useCallback(async () => {
    try {
      const res = await fetch('/api/markets')
      const data = await res.json()
      const saved = JSON.parse(localStorage.getItem('marketNicknames') || '{}')
      const markets = (data.tables || []).map((t: string) => {
        const cfg = saved[t] || {}
        return { name: cfg.nickname || t, type: (cfg.type || 'Forex') as AssetType, table: t }
      })
      setAssets(markets)
      if (markets.length > 0) {
        setSelectedAsset((prev) => prev || markets[0])
      }
    } catch (err) {
      console.error('Failed to load markets', err)
    }
  }, [])

  React.useEffect(() => {
    loadMarkets()
    const handler = () => loadMarkets()
    window.addEventListener('markets-updated', handler)
    return () => window.removeEventListener('markets-updated', handler)
  }, [loadMarkets])

  const filteredAssets = assets.filter((asset) => asset.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const currentAsset = selectedAsset || assets[0]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="group-data-[collapsed=true]:justify-center">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    {currentAsset && React.createElement(assetTypeIcons[currentAsset.type], { className: "size-4" })}
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none group-data-[collapsed=true]:hidden">
                    <span className="font-semibold">{currentAsset?.name}</span>
                    <span className="text-xs">{currentAsset?.type}</span>
                  </div>
                  <ChevronDown className="ml-auto size-4 group-data-[collapsed=true]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                <div className="p-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2 rounded-md border px-2">
                    <Search className="size-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search market..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 border-0 p-0 focus-visible:ring-0"
                      autoComplete="off"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                {filteredAssets.map((asset) => (
                  <DropdownMenuItem
                    key={asset.name}
                    onSelect={() => {
                      setSelectedAsset(asset)
                      setSearchQuery("")
                    }}
                  >
                    {React.createElement(assetTypeIcons[asset.type], { className: "mr-2 size-4" })}
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span>{asset.name}</span>
                      <span className="text-xs text-muted-foreground">{asset.type}</span>
                    </div>
                    {currentAsset && currentAsset.name === asset.name && <Check className="ml-auto size-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <TooltipProvider>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <ThemeSwitcher />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton className="group-data-[collapsed=true]:justify-center">
                        <User2 className="size-4" />
                        <span className="group-data-[collapsed=true]:hidden">trader@example.com</span>
                        <ChevronUp className="ml-auto size-4 group-data-[collapsed=true]:hidden" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-popper-anchor-width]" side="top" align="start">
                      <DropdownMenuItem>
                        <User2 className="mr-2 size-4" />
                        <span>Account</span>
                      </DropdownMenuItem>
                      <Dialog>
                        <DropdownMenuItem
                          asChild
                          onSelect={(e) => {
                            e.preventDefault()
                            setSettingsOpen(false) // Close settings if open
                          }}
                        >
                          <DialogTrigger className="w-full">
                            <div className="flex w-full items-center">
                              <CreditCard className="mr-2 size-4" />
                              <span>Trading Accounts</span>
                            </div>
                          </DialogTrigger>
                        </DropdownMenuItem>
                        <TradingAccountsDialog />
                      </Dialog>
                      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                        <DropdownMenuItem
                          asChild
                          onSelect={(e) => {
                            e.preventDefault()
                            setSettingsOpen(true)
                          }}
                        >
                          <DialogTrigger className="w-full">
                            <div className="flex w-full items-center">
                              <Settings className="mr-2 size-4" />
                              <span>Settings</span>
                            </div>
                          </DialogTrigger>
                        </DropdownMenuItem>
                        <SettingsDialog />
                      </Dialog>
                      <DropdownMenuItem>
                        <LogOut className="mr-2 size-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent side="right" className="hidden group-data-[collapsed=true]:block">
                  Account
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </TooltipProvider>
      <SidebarRail />
    </Sidebar>
  )
}

