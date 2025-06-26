"use client"

import * as React from "react"
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, HardDrive, PenToolIcon as Tool, Terminal, LineChart } from "lucide-react"

type MarketConfig = { table: string; nickname: string; type: string }

function MarketSettings() {
  const [markets, setMarkets] = React.useState<MarketConfig[]>([])

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/markets')
        const data = await res.json()
        const saved = JSON.parse(localStorage.getItem('marketNicknames') || '{}')
        const configs = (data.tables || []).map((t: string) => ({
          table: t,
          nickname: saved[t]?.nickname || t,
          type: saved[t]?.type || 'Forex',
        }))
        setMarkets(configs)
      } catch (err) {
        console.error('Failed to load markets', err)
      }
    }
    load()
  }, [])

  const updateNickname = (i: number, value: string) => {
    setMarkets((prev) => prev.map((m, idx) => (idx === i ? { ...m, nickname: value } : m)))
  }

  const updateType = (i: number, value: string) => {
    setMarkets((prev) => prev.map((m, idx) => (idx === i ? { ...m, type: value } : m)))
  }

  const save = () => {
    const store: Record<string, { nickname: string; type: string }> = {}
    markets.forEach((m) => {
      store[m.table] = { nickname: m.nickname, type: m.type }
    })
    localStorage.setItem('marketNicknames', JSON.stringify(store))
    window.dispatchEvent(new Event('markets-updated'))
  }

  if (markets.length === 0) {
    return <p className="text-sm text-muted-foreground">No markets found</p>
  }

  return (
    <div className="space-y-4 py-2">
      {markets.map((m, i) => (
        <div key={m.table} className="flex items-center gap-2">
          <Label className="w-1/3">{m.table}</Label>
          <Input
            value={m.nickname}
            onChange={(e) => updateNickname(i, e.target.value)}
            className="flex-1"
          />
          <Select value={m.type} onValueChange={(val) => updateType(i, val)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['Forex', 'Index', 'Commodity', 'Crypto', 'Stock'].map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      <Button onClick={save} className="w-full">
        Save
      </Button>
    </div>
  )
}

export function SettingsDialog() {
  return (
    <DialogContent className="sm:max-w-[625px]">
      <DialogHeader>
        <DialogTitle>Settings</DialogTitle>
      </DialogHeader>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Storage
          </TabsTrigger>
          <TabsTrigger value="markets" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Markets
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Tool className="h-4 w-4" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" placeholder="Enter your display name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Notifications</Label>
              <div className="flex items-center space-x-2">
                <Switch id="email" />
                <Label htmlFor="email">Receive email notifications</Label>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="storage" className="space-y-4">
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Storage Usage</Label>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full w-1/3 rounded-full bg-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Using 2.5GB of 10GB</p>
            </div>
            <Button variant="outline" className="w-full">
              Manage Storage
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="markets" className="space-y-4">
          <MarketSettings />
        </TabsContent>
        <TabsContent value="advanced" className="space-y-4">
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="api">API Access</Label>
              <div className="flex items-center space-x-2">
                <Switch id="api" />
                <Label htmlFor="api">Enable API access</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="debug">Debug Mode</Label>
              <div className="flex items-center space-x-2">
                <Switch id="debug" />
                <Label htmlFor="debug">Enable debug mode</Label>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="system" className="space-y-4">
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>System Information</Label>
              <div className="rounded-md border p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Version</p>
                    <p className="text-sm text-muted-foreground">1.0.0</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Check for Updates
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </DialogContent>
  )
}

