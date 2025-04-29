"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const countries = [
  { value: "us", label: "United States" },
  { value: "cn", label: "China" },
  { value: "jp", label: "Japan" },
  { value: "de", label: "Germany" },
  { value: "gb", label: "United Kingdom" },
  { value: "in", label: "India" },
  { value: "fr", label: "France" },
  { value: "it", label: "Italy" },
  { value: "ca", label: "Canada" },
  { value: "kr", label: "South Korea" },
  { value: "ru", label: "Russia" },
  { value: "br", label: "Brazil" },
  { value: "au", label: "Australia" },
  { value: "mx", label: "Mexico" },
  { value: "id", label: "Indonesia" },
  { value: "nl", label: "Netherlands" },
  { value: "ch", label: "Switzerland" },
  { value: "sa", label: "Saudi Arabia" },
  { value: "tr", label: "Turkey" },
  { value: "pl", label: "Poland" },
] as const

type Country = (typeof countries)[number]["value"]

interface EconomicIndicator {
  name: string
  previous: string
  current: string
  forecast: string
  date: string
}

// Sample data for demonstration - in a real app, this would come from an API
const economicData: Partial<Record<Country, EconomicIndicator[]>> = {
  us: [
    { name: "GDP Growth Rate", previous: "2.1%", current: "2.3%", forecast: "2.4%", date: "2024-02-07" },
    { name: "Inflation Rate", previous: "3.4%", current: "3.1%", forecast: "3.0%", date: "2024-02-07" },
    { name: "Unemployment Rate", previous: "3.7%", current: "3.7%", forecast: "3.8%", date: "2024-02-07" },
    { name: "Interest Rate", previous: "5.50%", current: "5.50%", forecast: "5.25%", date: "2024-02-07" },
  ],
  cn: [
    { name: "GDP Growth Rate", previous: "1.3%", current: "1.0%", forecast: "1.2%", date: "2024-02-07" },
    { name: "Inflation Rate", previous: "0.1%", current: "0.2%", forecast: "0.4%", date: "2024-02-07" },
    { name: "Unemployment Rate", previous: "5.0%", current: "5.1%", forecast: "5.0%", date: "2024-02-07" },
    { name: "Interest Rate", previous: "3.45%", current: "3.45%", forecast: "3.45%", date: "2024-02-07" },
  ],
  // Add more countries as needed
}

// Default data template for countries without specific data
const defaultIndicators: EconomicIndicator[] = [
  { name: "GDP Growth Rate", previous: "N/A", current: "N/A", forecast: "N/A", date: "-" },
  { name: "Inflation Rate", previous: "N/A", current: "N/A", forecast: "N/A", date: "-" },
  { name: "Unemployment Rate", previous: "N/A", current: "N/A", forecast: "N/A", date: "-" },
  { name: "Interest Rate", previous: "N/A", current: "N/A", forecast: "N/A", date: "-" },
]

export function EconomicData() {
  const [open, setOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<Country>("us")

  const getCountryData = (country: Country) => {
    return economicData[country] || defaultIndicators
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Economic Indicators</h3>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} className="w-[200px] justify-between">
              {countries.find((country) => country.value === selectedCountry)?.label ?? "Select country..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search country..." />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {countries.map((country) => (
                    <CommandItem
                      key={country.value}
                      value={country.value}
                      onSelect={(currentValue) => {
                        setSelectedCountry(currentValue as Country)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", selectedCountry === country.value ? "opacity-100" : "opacity-0")}
                      />
                      {country.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Indicator</TableHead>
              <TableHead>Previous</TableHead>
              <TableHead>Current</TableHead>
              <TableHead>Forecast</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getCountryData(selectedCountry).map((indicator) => (
              <TableRow key={indicator.name}>
                <TableCell className="font-medium">{indicator.name}</TableCell>
                <TableCell>{indicator.previous}</TableCell>
                <TableCell>{indicator.current}</TableCell>
                <TableCell>{indicator.forecast}</TableCell>
                <TableCell className="text-right">{indicator.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

