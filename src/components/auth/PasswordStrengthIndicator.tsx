"use client";

import { Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[@$!%*?&]/.test(password),
  };

  const strength = Object.values(checks).filter(Boolean).length;
  const percentage = (strength / 5) * 100;

  let color = "bg-red-500";
  let label = "弱い";

  if (strength >= 4) {
    color = "bg-green-500";
    label = "強い";
  } else if (strength >= 3) {
    color = "bg-yellow-500";
    label = "普通";
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Progress value={percentage} className="h-2" indicatorClassName={color} />
        <span className="text-sm font-medium text-muted-foreground min-w-[3rem]">{label}</span>
      </div>
      <ul className="text-xs space-y-1.5">
        <li
          className={`flex items-center gap-2 ${checks.length ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
        >
          {checks.length ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          <span>8文字以上</span>
        </li>
        <li
          className={`flex items-center gap-2 ${checks.lowercase ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
        >
          {checks.lowercase ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          <span>英小文字を含む</span>
        </li>
        <li
          className={`flex items-center gap-2 ${checks.uppercase ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
        >
          {checks.uppercase ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          <span>英大文字を含む</span>
        </li>
        <li
          className={`flex items-center gap-2 ${checks.number ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
        >
          {checks.number ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          <span>数字を含む</span>
        </li>
        <li
          className={`flex items-center gap-2 ${checks.symbol ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
        >
          {checks.symbol ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          <span>記号(@$!%*?&)を含む</span>
        </li>
      </ul>
    </div>
  );
}
