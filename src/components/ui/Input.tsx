import * as React from "react"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={
          `flex h-11 w-full rounded-lg border border-[var(--card-border)] bg-black/30 px-4 py-2 text-sm transition-colors duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--text-faint)] focus-visible:outline-none focus-visible:border-[rgba(230,126,34,0.5)] focus-visible:ring-1 focus-visible:ring-[rgba(230,126,34,0.35)] disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`
        }
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
