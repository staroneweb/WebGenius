import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        data-slot="button"
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]': variant === 'default',
            'border border-border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 active:scale-[0.98]': variant === 'outline',
            'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 active:scale-[0.98]': variant === 'ghost',
            'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 active:scale-[0.98]': variant === 'destructive',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]': variant === 'secondary',
            'text-primary underline-offset-4 hover:underline': variant === 'link',
            'h-9 px-4 py-2 has-[>svg]:px-3': size === 'default',
            'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5': size === 'sm',
            'h-10 rounded-md px-6 has-[>svg]:px-4': size === 'lg',
            'size-9': size === 'icon',
            'size-8': size === 'icon-sm',
            'size-10': size === 'icon-lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;

