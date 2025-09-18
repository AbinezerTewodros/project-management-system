import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

// eslint-disable-next-line react-refresh/only-export-components
export const buttonStyles = cva(["hover:bg-secondary-hover", "transition-colors"],
    {
    variants: {
        variant: {
            default: ["bg-secondary"],
            ghost: ["hover:bg-purple-200",
                "dark:hover:bg-gray-700",
                   ]
        },
        size: {
            default: ["rounded", "p-2"],
            icon: [
                "rounded-full",
                "w-11",
                "h-11", 
                "flex",
                "items-center",
                "justify-center",
                "p-2.5",
                 ],
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    }
})
type ButtonProps = VariantProps<typeof buttonStyles> & ComponentProps<"button"> 

const Button = ({ variant, size, className, ...props }:ButtonProps) => {
  return (
    <button {...props} 
    className={twMerge(className, buttonStyles({variant , size}), className)}/>
  )
}

export default Button;