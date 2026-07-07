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
    
    const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer ring-offset-background transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    const variants = {
      default: "bg-gradient-to-br from-[var(--brasa-light)] via-[var(--brasa)] to-[var(--brasa-deep)] text-white shadow-[0_4px_20px_var(--brasa-glow)] hover:shadow-[0_6px_30px_rgba(230,126,34,0.45)] hover:brightness-110",
      outline: "border border-[var(--card-border)] bg-white/[0.02] hover:bg-white/[0.06] hover:border-[rgba(245,200,160,0.25)] text-[var(--foreground)]",
      ghost: "hover:bg-white/[0.05] hover:text-[var(--foreground)]",
    }
    
    const sizes = {
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
