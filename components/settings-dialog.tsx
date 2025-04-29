"use client"

import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Settings, HardDrive, PenToolIcon as Tool, Terminal } from "lucide-react"

export function SettingsDialog() {
  return (
    <DialogContent className="sm:max-w-[625px]">
      <DialogHeader>
        <DialogTitle>Settings</DialogTitle>
      </DialogHeader>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Storage
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

