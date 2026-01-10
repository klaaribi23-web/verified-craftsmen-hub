import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface FrenchPhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
}

/**
 * Format a phone number for display (XX XX XX XX XX)
 */
const formatPhoneDisplay = (phone: string): string => {
  // Remove all non-digits except leading +
  const cleaned = phone.replace(/[^\d]/g, "");
  
  // Format as XX XX XX XX XX
  const groups = [];
  for (let i = 0; i < cleaned.length && i < 10; i += 2) {
    groups.push(cleaned.slice(i, i + 2));
  }
  return groups.join(" ");
};

/**
 * Validate French phone number
 * Returns true if valid French number (10 digits starting with 0)
 */
export const validateFrenchPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s.-]/g, "");
  return /^0[1-9]\d{8}$/.test(cleaned);
};

/**
 * Convert to international format (+33)
 */
export const toInternationalFormat = (phone: string): string => {
  const cleaned = phone.replace(/[\s.-]/g, "");
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `+33${cleaned.slice(1)}`;
  }
  return phone;
};

/**
 * Convert from international format to local (0X XX XX XX XX)
 */
export const fromInternationalFormat = (phone: string): string => {
  if (phone.startsWith("+33")) {
    return `0${phone.slice(3)}`;
  }
  if (phone.startsWith("33") && phone.length === 11) {
    return `0${phone.slice(2)}`;
  }
  return phone;
};

export const FrenchPhoneInput = forwardRef<HTMLInputElement, FrenchPhoneInputProps>(
  ({ value, onChange, error, disabled, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      // Get only digits from input
      const inputValue = e.target.value;
      const digitsOnly = inputValue.replace(/[^\d]/g, "");
      
      // Limit to 10 digits
      const limitedDigits = digitsOnly.slice(0, 10);
      
      // Format for display
      const formatted = formatPhoneDisplay(limitedDigits);
      onChange(formatted);
    };

    return (
      <div className={cn("relative flex", disabled && "opacity-60")}>
        {/* French flag and +33 prefix */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 border border-r-0 rounded-l-md",
          disabled ? "bg-muted cursor-not-allowed" : "bg-muted/50",
          "border-input text-sm text-muted-foreground",
          error && "border-destructive"
        )}>
          <span className="text-base" role="img" aria-label="Drapeau français">🇫🇷</span>
          <span className="font-medium">+33</span>
        </div>
        
        <Input
          ref={ref}
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          placeholder="06 12 34 56 78"
          disabled={disabled}
          className={cn(
            "rounded-l-none",
            error && "border-destructive focus-visible:ring-destructive",
            disabled && "bg-muted cursor-not-allowed",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

FrenchPhoneInput.displayName = "FrenchPhoneInput";
