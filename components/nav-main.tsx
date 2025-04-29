"use client"
import {
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  Gauge,
  LineChart,
  Network,
  PieChart,
  ScrollText,
  Signal,
  TimerReset,
  Wallet,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const items = [
  {
    title: "Dashboard",
    icon: Gauge,
    url: "/",
    subItems: [
      {
        title: "Macro",
        url: "/dashboard/macro",
        icon: Signal,
      },
      {
        title: "Micro",
        url: "/dashboard/micro",
        icon: BarChart3,
      },
      {
        title: "Correlation",
        url: "/dashboard/correlation",
        icon: Network,
      },
    ],
  },
  {
    title: "Live",
    icon: TimerReset,
    url: "/live",
    subItems: [
      {
        title: "Prices",
        url: "/live/prices",
        icon: LineChart,
      },
      {
        title: "Volumes",
        url: "/live/volumes",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Trading",
    icon: Wallet,
    url: "/trading",
    subItems: [
      {
        title: "Inputs",
        url: "/trading/inputs",
        icon: ScrollText,
      },
      {
        title: "Data",
        url: "/trading/data",
        icon: CircleDollarSign,
      },
      {
        title: "Returns",
        url: "/trading/returns",
        icon: LineChart,
      },
      {
        title: "Statistics",
        url: "/trading/statistics",
        icon: PieChart,
      },
      {
        title: "Probabilities",
        url: "/trading/probabilities",
        icon: Signal,
      },
    ],
  },
]

export function NavMain() {
  const pathname = usePathname()

  return (
    <TooltipProvider>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <Collapsible
                key={item.title}
                defaultOpen={pathname.startsWith(item.url) || item.title === "Live" || item.title === "Trading"}
              >
                <SidebarMenuItem className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild className="flex-1">
                        <Link
                          href={item.url}
                          className={cn(
                            "group-data-[collapsed=true]:justify-center",
                            pathname === item.url && "text-primary font-medium",
                          )}
                        >
                          <item.icon className="size-4" />
                          <span className="group-data-[collapsed=true]:hidden">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="hidden group-data-[collapsed=true]:block">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                  {item.subItems && item.subItems.length > 0 && (
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-muted hidden group-data-[collapsed=false]:flex"
                      >
                        <ChevronRight className="size-4 transition-transform group-data-[state=open]:rotate-90" />
                        <span className="sr-only">Toggle {item.title} submenu</span>
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </SidebarMenuItem>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.subItems?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title} className="group/sub-item">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton asChild>
                              <Link
                                href={subItem.url}
                                className={cn(
                                  "group-data-[collapsed=true]:justify-center",
                                  pathname === subItem.url && "text-primary font-medium bg-primary/10",
                                )}
                              >
                                <subItem.icon className="size-4" />
                                <span className="group-data-[collapsed=true]:hidden">{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="hidden group-data-[collapsed=true]:block">
                            {subItem.title}
                          </TooltipContent>
                        </Tooltip>
                        {subItem.subItems && subItem.subItems.length > 0 && (
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-muted hidden group-data-[collapsed=false]:flex opacity-0 group-hover/sub-item:opacity-100"
                            >
                              <ChevronRight className="size-4 transition-transform group-data-[state=open]:rotate-90" />
                              <span className="sr-only">Toggle {subItem.title} submenu</span>
                            </Button>
                          </CollapsibleTrigger>
                        )}
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </TooltipProvider>
  )
}

