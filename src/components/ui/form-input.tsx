import * as React from 'react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';

export interface FormInputProps extends React.ComponentProps<'input'> {
  label?: string;
  error?: string;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, label, error, id, required, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-2">
        {label && (
          <Label htmlFor={inputId} className={error ? 'text-destructive' : ''}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <Input
          id={inputId}
          ref={ref}
          required={required}
          className={cn(
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export { FormInput };

