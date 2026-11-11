"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 relative inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {/* Logical inline-start positioning (not translate-x): CSS transforms
          are physical, so a fixed +x shift slides the knob the WRONG way
          (toward the start / outside the track) in RTL layouts. `start-*`
          resolves to inset-inline-start and flips with direction. */}
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none absolute start-0.5 top-1/2 size-4 -translate-y-1/2 rounded-full ring-0 transition-all data-[state=checked]:start-[calc(100%-18px)] data-[state=unchecked]:start-0.5"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
