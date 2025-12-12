"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

interface InvalidTokenMessageProps {
  error: string;
}

export function InvalidTokenMessage({ error }: InvalidTokenMessageProps) {
  const t = useTranslations("auth.firstLogin");
  const tCalendar = useTranslations("calendar.detail");

  return (
    <div className="text-center space-y-4">
      <h2 className="text-2xl font-bold text-destructive">{t("invalidToken")}</h2>
      <p className="text-muted-foreground">{error}</p>
      <p className="text-sm text-muted-foreground">{t("invalidTokenMessage")}</p>
      <Button asChild>
        <Link href="/">{tCalendar("backToTop")}</Link>
      </Button>
    </div>
  );
}
