import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'interactive' | 'outline';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-slate-900/90 border border-slate-800 text-slate-100 shadow-lg shadow-black/40',
      glass: 'bg-slate-900/60 backdrop-blur-md border border-slate-800/80 text-slate-100 shadow-xl',
      interactive:
        'bg-slate-900 border border-slate-800 text-slate-100 hover:border-emerald-500/50 hover:shadow-emerald-950/20 transition-all duration-200 cursor-pointer active:scale-[0.995]',
      outline: 'bg-transparent border border-slate-800 text-slate-100',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-2xl p-5', variantStyles[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 pb-3', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-lg font-semibold tracking-tight text-white', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-xs text-slate-400', className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('pt-1', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center pt-4 border-t border-slate-800/60', className)} {...props}>
    {children}
  </div>
);
