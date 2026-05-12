import { useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

const OTP_LENGTH = 6;

export function OtpInput({ value, onChange, error, disabled }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const reducedMotion = useReducedMotion();
  const digits = useMemo(
    () => Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? ""),
    [value],
  );

  useEffect(() => {
    if (!disabled) {
      refs.current[0]?.focus();
    }
  }, [disabled]);

  function setDigit(index: number, digit: string) {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").slice(0, OTP_LENGTH));
    if (digit && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-6 gap-2" aria-label="Verification code">
        {digits.map((digit, index) => (
          <motion.input
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            value={digit}
            disabled={disabled}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-label={`Digit ${index + 1}`}
            onChange={(event) => {
              const nextDigit = event.target.value.replace(/\D/g, "").slice(-1);
              setDigit(index, nextDigit);
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !digit && index > 0) {
                refs.current[index - 1]?.focus();
              }
            }}
            onPaste={(event) => {
              event.preventDefault();
              const pasted = event.clipboardData
                .getData("text")
                .replace(/\D/g, "")
                .slice(0, OTP_LENGTH);
              onChange(pasted);
              refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
            }}
            whileFocus={reducedMotion ? undefined : { scale: 1.02 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "h-12 min-w-0 rounded-lg border border-input bg-background text-center text-lg font-semibold outline-none transition-shadow",
              "focus:border-transparent focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
              error && "border-destructive focus:ring-destructive",
            )}
          />
        ))}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
