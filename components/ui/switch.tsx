"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick"> {
  checked?: boolean
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void
}

const Switch = React.forwardRef<HTMLDivElement, SwitchProps>(
  ({ className, checked = false, onClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="switch"
        aria-checked={checked}
        onClick={onClick}
        className={cn(
          "peer inline-flex h-5 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
          className,
        )}
        data-state={checked ? "checked" : "unchecked"}
        {...props}
      >
        <div
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
            checked ? "translate-x-6" : "translate-x-0",
          )}
        />
      </div>
    )
  },
)
Switch.displayName = "Switch"

export { Switch }

