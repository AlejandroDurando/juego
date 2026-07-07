import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

// We are not using class-variance-authority for simplicity, 
// just standard tailwind classes for elegant buttons.

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    let baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer ring-offset-background transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    let variants = {
      default: "bg-[var(--brasa)] text-white hover:bg-[var(--brasa-light)] shadow-sm",
      outline: "border border-[var(--card-border)] bg-transparent hover:bg-[var(--card-bg)] text-[var(--foreground)]",
      ghost: "hover:bg-[var(--card-bg)] hover:text-[var(--foreground)]",
    }
    
    let sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8 text-base",
      icon: "h-10 w-10",
    }
    
    const finalClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ""}`

    return (
      <Comp
        className={finalClassName}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
