"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState, useEffect, useCallback } from "react"
import { CalendarIcon, ImageIcon } from "lucide-react"
import { format } from "date-fns"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { AssetCombobox } from "@/components/asset-combobox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const formSchema = z
  .object({
    positionType: z.enum(["real", "demo"]).transform(val => val.toLowerCase()).default("real"),
    date: z.string().min(1, "Date is required"),
    asset: z.string().min(1, "Asset is required"),
    bias: z.boolean(),
    entryPrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Entry price must be a valid positive number",
    }),
    tpPrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Take profit price must be a valid positive number",
    }),
    slPrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Stop loss price must be a valid positive number",
    }),
    riskPercentage: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 100, {
      message: "Risk percentage must be between 0 and 100",
    }),
    state: z.enum(["in", "out"]),
    breakEven: z.boolean(),
    partialPrice: z.string().optional(),
    screenshot: z.string().url().optional().or(z.literal("")),
    finality: z.enum(["tp", "sl", "partial"]).optional(),
    accountNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.state === "out" && !data.finality) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a finality when closing a position",
        path: ["finality"],
      })
    }
  })

type FormValues = z.infer<typeof formSchema>

interface InputFormProps {
  onAssetChange: (asset: string) => void
  onPositionUpdate: (position: {
    entry: number
    takeProfit?: number
    stopLoss?: number
    exitPrice?: number
    isLong: boolean
  }) => void
}

export function InputForm({ onAssetChange, onPositionUpdate }: InputFormProps) {
  const router = useRouter()
  const [screenshotPreview, setScreenshotPreview] = useState<string>("")
  const [activeButton, setActiveButton] = useState<"in" | "out" | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      positionType: "real",
      date: new Date().toISOString(),
      asset: "",
      bias: true,
      entryPrice: "",
      tpPrice: "",
      slPrice: "",
      riskPercentage: "",
      state: "in",
      breakEven: false,
      partialPrice: "",
      screenshot: "",
      finality: undefined,
      accountNumber: "",
    },
  })

  // Watch for changes in relevant form fields
  const entryPrice = form.watch("entryPrice")
  const tpPrice = form.watch("tpPrice")
  const slPrice = form.watch("slPrice")
  const partialPrice = form.watch("partialPrice")
  const bias = form.watch("bias")

  // Update position whenever relevant fields change
  const debouncedUpdate = useCallback(() => {
    const entry = Number.parseFloat(entryPrice)
    if (!isNaN(entry)) {
      onPositionUpdate({
        entry,
        takeProfit: Number.parseFloat(tpPrice) || undefined,
        stopLoss: Number.parseFloat(slPrice) || undefined,
        exitPrice: Number.parseFloat(partialPrice) || undefined,
        isLong: bias,
      })
    }
  }, [entryPrice, tpPrice, slPrice, partialPrice, bias, onPositionUpdate])

  useEffect(() => {
    const timeoutId = setTimeout(debouncedUpdate, 100)
    return () => clearTimeout(timeoutId)
  }, [debouncedUpdate])

  async function onSubmit(data: FormValues) {
    try {
      const formData = {
        type: data.positionType.toLowerCase(),
        exitType: data.finality || null,
        date: data.date,
        asset: data.asset,
        bias: data.bias,
        entryPrice: data.entryPrice,
        tpPrice: data.tpPrice || null,
        slPrice: data.slPrice || null,
        riskPercentage: data.riskPercentage,
        breakEven: data.breakEven,
        partialPrice: data.partialPrice || null,
        screenshot: data.screenshot || null,
        accountNumber: data.accountNumber || null,
      }

      const response = await fetch("/api/positions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle validation errors
        if (response.status === 400 && result.details) {
          const errorMessage = result.details
            .map((detail: { field: string; message: string }) => `${detail.field}: ${detail.message}`)
            .join("\n")
          throw new Error(errorMessage)
        }
        throw new Error(result.error || `HTTP error! status: ${response.status}`)
      }

      if (result.success) {
        toast.success("Position saved successfully")
        form.reset()
        setScreenshotPreview("")
        router.refresh()
      } else {
        throw new Error(result.error || "Failed to save position")
      }
    } catch (error) {
      console.error("Error saving position:", error)

      let errorMessage = "An unexpected error occurred while saving the position"
      if (error instanceof Error) {
        errorMessage = error.message
      }

      toast.error(errorMessage, {
        description: "Please check your input values and try again.",
      })
    }
  }

  const handleScreenshotChange = (value: string) => {
    if (value && value.match(/^https?:\/\/.+/)) {
      setScreenshotPreview(value)
    } else {
      setScreenshotPreview("")
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Inputs</CardTitle>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => form.setValue("positionType", "real")}
            className={cn(
              form.watch("positionType") === "real"
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Real
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => form.setValue("positionType", "demo")}
            className={cn(
              form.watch("positionType") === "demo"
                ? "bg-purple-500 hover:bg-purple-600 text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Demo
          </Button>
          <div className="relative w-32">
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <Input 
                  type="text" 
                  placeholder="Account #"
                  size={12}
                  className="h-9 text-xs"
                  {...field} 
                />
              )}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-[1fr,1fr,1fr]">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <div className="grid gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(new Date(field.value), "dd/MM/yyyy HH:mm")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  // Preserve the current time or set to current time if no date was previously selected
                                  const currentDate = field.value ? new Date(field.value) : new Date()
                                  date.setHours(currentDate.getHours())
                                  date.setMinutes(currentDate.getMinutes())
                                  field.onChange(date.toISOString())
                                }
                              }}
                              initialFocus
                            />
                            <div className="border-t p-3">
                              <Input
                                type="time"
                                value={
                                  field.value ? format(new Date(field.value), "HH:mm") : format(new Date(), "HH:mm")
                                }
                                onChange={(e) => {
                                  const [hours, minutes] = e.target.value.split(":")
                                  const date = field.value ? new Date(field.value) : new Date()
                                  date.setHours(Number.parseInt(hours))
                                  date.setMinutes(Number.parseInt(minutes))
                                  field.onChange(date.toISOString())
                                }}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="asset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset</FormLabel>
                    <FormControl>
                      <AssetCombobox
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value)
                          // @ts-ignore - We know value will be a string in practice
                          onAssetChange(value)
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bias</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={field.value ? "default" : "outline"}
                          className={cn(
                            "flex-1",
                            field.value ? "bg-green-500 hover:bg-green-600" : "text-muted-foreground",
                          )}
                          onClick={() => field.onChange(true)}
                        >
                          Long
                        </Button>
                        <Button
                          type="button"
                          variant={!field.value ? "default" : "outline"}
                          className={cn(
                            "flex-1",
                            !field.value ? "bg-red-500 hover:bg-red-600" : "text-muted-foreground",
                          )}
                          onClick={() => field.onChange(false)}
                        >
                          Short
                        </Button>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="entryPrice"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Entry</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.00001" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tpPrice"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>TP</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.00001" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="slPrice"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>SL</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.00001" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="riskPercentage"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Risk</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" max="100" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1">
                    <Button
                      type="button"
                      variant={activeButton === "in" ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "flex-1",
                        activeButton === "in" ? "bg-blue-500 hover:bg-blue-600" : "text-muted-foreground",
                      )}
                      onClick={() => {
                        setActiveButton(activeButton === "in" ? null : "in")
                        form.setValue("state", "in")
                        // Clear finality when "In" is selected
                        if (activeButton !== "in") {
                          form.setValue("finality", undefined)
                        }
                      }}
                    >
                      In
                    </Button>
                    <Button
                      type="button"
                      variant={activeButton === "out" ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "flex-1",
                        activeButton === "out" ? "bg-red-700 hover:bg-red-800" : "text-muted-foreground",
                      )}
                      onClick={() => {
                        setActiveButton(activeButton === "out" ? null : "out")
                        form.setValue("state", "out")
                        // If switching to "out" and no finality is selected, select TP by default
                        if (!form.watch("finality")) {
                          form.setValue("finality", "tp")
                        }
                      }}
                    >
                      Out
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name="breakEven"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-center gap-1">
                        <FormLabel className="text-sm">BE</FormLabel>
                        <FormControl>
                          <div className="transform rotate-270">
                            <Switch checked={field.value} onClick={() => field.onChange(!field.value)} />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="partialPrice"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Partial Exit</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.00001" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="screenshot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Screenshot Link</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value)
                            handleScreenshotChange(e.target.value)
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 h-[36px]"> {/* Fixed height to match Apply button */}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={activeButton === "in"}
                    onClick={() => {
                      if (activeButton === "out") {
                        // When "Out" is selected, only allow changing between options
                        form.setValue("finality", "tp")
                      } else {
                        // When "In" is selected, allow toggling
                        const newValue = form.watch("finality") === "tp" ? undefined : "tp"
                        form.setValue("finality", newValue)
                      }
                    }}
                    className={cn(
                      "flex-1",
                      form.watch("finality") === "tp"
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "text-muted-foreground hover:text-foreground",
                      activeButton === "out" && !form.watch("finality") && "border-red-500",
                    )}
                  >
                    TP
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={activeButton === "in"}
                    onClick={() => {
                      if (activeButton === "out") {
                        form.setValue("finality", "partial")
                      } else {
                        const newValue = form.watch("finality") === "partial" ? undefined : "partial"
                        form.setValue("finality", newValue)
                      }
                    }}
                    className={cn(
                      "flex-1",
                      form.watch("finality") === "partial"
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                        : "text-muted-foreground hover:text-foreground",
                      activeButton === "out" && !form.watch("finality") && "border-red-500",
                    )}
                  >
                    Partial
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={activeButton === "in"}
                    onClick={() => {
                      if (activeButton === "out") {
                        form.setValue("finality", "sl")
                      } else {
                        const newValue = form.watch("finality") === "sl" ? undefined : "sl"
                        form.setValue("finality", newValue)
                      }
                    }}
                    className={cn(
                      "flex-1",
                      form.watch("finality") === "sl"
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "text-muted-foreground hover:text-foreground",
                      activeButton === "out" && !form.watch("finality") && "border-red-500",
                    )}
                  >
                    SL
                  </Button>
                </div>
                {form.formState.errors.finality && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.finality.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <FormField
                  control={form.control}
                  name="screenshot"
                  render={() => (
                    <FormItem>
                      <FormLabel>Preview</FormLabel>
                      <FormControl>
                        {screenshotPreview ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full">
                                <ImageIcon className="mr-2 h-4 w-4" />
                                Show
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[400px] p-0">
                              <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted">
                                <img
                                  src={screenshotPreview || "/placeholder.svg"}
                                  alt="Screenshot preview"
                                  className="h-full w-full object-cover"
                                  onError={() => setScreenshotPreview("")}
                                />
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button variant="outline" className="w-full" disabled>
                            <ImageIcon className="mr-2 h-4 w-4" />
                            No Image
                          </Button>
                        )}
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Apply
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

