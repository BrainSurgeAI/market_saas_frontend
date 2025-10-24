import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        primary: "bg-blue-500 text-white hover:bg-blue-600",
        success: "bg-green-500 text-white hover:bg-green-600",
        warning: "bg-orange-400 text-white hover:bg-orange-600",
        orderPending: "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200",
        orderConfirmed: "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200",
        orderProcessing: "bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200",
        orderStocked: "bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200",
        orderCompleted: "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200",
        orderCanceled: "bg-red-100 text-red-700 border-red-300 hover:bg-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
