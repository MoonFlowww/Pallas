import * as React from "react"
import { cn } from "@/utils/cn"

const ButtonGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}
      {...props}
    />
  ),
)
ButtonGroup.displayName = "ButtonGroup"

export { ButtonGroup }

