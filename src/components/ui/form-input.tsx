import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';

export interface FormInputProps extends React.ComponentProps<'input'> {
  label?: string;
  error?: string;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, label, error, id, required, type, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s/g, '-')}` : undefined);
    const isPassword = type === 'password';
    const [showPassword, setShowPassword] = React.useState(false);
    const effectiveType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="w-full space-y-2">
        {label && (
          <Label htmlFor={inputId} className={error ? 'text-destructive' : ''}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <div className="relative">
          <Input
            id={inputId}
            ref={ref}
            type={effectiveType}
            required={required}
            className={cn(
              error && 'border-destructive focus-visible:ring-destructive',
              isPassword && 'pr-10',
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export { FormInput };

