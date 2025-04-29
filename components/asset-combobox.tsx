"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type Asset = {
  value: string
  label: string
}

const defaultAssets: Asset[] = [
  {
    value: "eurusd",
    label: "EUR/USD",
  },
  {
    value: "gbpusd",
    label: "GBP/USD",
  },
  {
    value: "usdjpy",
    label: "USD/JPY",
  },
  {
    value: "nas100",
    label: "NAS100",
  },
  {
    value: "ngas",
    label: "NGAS",
  },
]

interface AssetComboboxProps {
  value?: string
  onChange?: (value: string) => void
}

export function AssetCombobox({ value, onChange }: AssetComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [assets, setAssets] = React.useState<Asset[]>(defaultAssets)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selectedAsset = assets.find((asset) => asset.value === value)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Enter" &&
      inputValue &&
      !assets.some((asset) => asset.label.toLowerCase() === inputValue.toLowerCase())
    ) {
      const newAsset: Asset = {
        value: inputValue.toLowerCase().replace(/[^a-z0-9]/g, ""),
        label: inputValue,
      }
      setAssets((prev) => [...prev, newAsset])
      onChange?.(newAsset.value)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex w-full gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Select or enter asset..."
            value={selectedAsset?.label || inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-full"
          />
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-10 p-0 shrink-0"
            onClick={() => {
              setOpen(!open)
              if (!open) {
                setInputValue("")
                inputRef.current?.focus()
              }
            }}
          >
            <ChevronsUpDown className="size-4 opacity-50" />
            <span className="sr-only">Toggle asset selection</span>
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>No asset found. Press Enter to add "{inputValue}"</CommandEmpty>
            <CommandGroup>
              {assets.map((asset) => (
                <CommandItem
                  key={asset.value}
                  value={asset.value}
                  onSelect={(currentValue) => {
                    onChange?.(currentValue === value ? "" : currentValue)
                    setInputValue("")
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 size-4", value === asset.value ? "opacity-100" : "opacity-0")} />
                  {asset.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

