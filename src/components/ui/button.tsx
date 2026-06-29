import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Flat, Apple HIG: weight 590, press feedback (scale .97), no gloss.
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[15px] font-[590] tracking-[-0.015em] transition-[transform,background-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 active:scale-[0.97] active:duration-[60ms] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // 1. Filled — the one primary CTA per screen
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        // 2. Tinted — secondary action
        tinted: 'bg-primary/15 text-primary hover:bg-primary/25',
        // 3. Gray — tertiary / neutral
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        // 4. Plain — text button
        ghost: 'hover:bg-accent hover:text-foreground',
        outline:
          'border border-border bg-transparent hover:bg-accent hover:text-foreground',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-[13px]',
        lg: 'h-11 rounded-lg px-6 text-[17px]',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
