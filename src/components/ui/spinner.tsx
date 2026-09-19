import { cn } from "cn"
import { SpinnerIcon } from "@phosphor-icons/react"

function Spinner({ className, color, ...props }: React.ComponentProps<"svg">) {
  return (
    <SpinnerIcon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      // Phosphor re-declares `color?: string`, so spreading a
      // `string | undefined` value is rejected under exactOptionalPropertyTypes.
      {...(color !== undefined ? { color } : {})}
      {...props}
    />
  )
}

export { Spinner }
