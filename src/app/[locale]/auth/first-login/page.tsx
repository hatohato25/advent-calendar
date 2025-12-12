"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";
import { InvalidTokenMessage } from "@/components/auth/InvalidTokenMessage";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";
import { LoadingFallback } from "@/components/ui/loading-fallback";

function FirstLoginContent() {
  const t = useTranslations("auth.firstLogin");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [verification, setVerification] = useState<{
    valid: boolean;
    username?: string;
    email?: string;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setVerification({ valid: false, error: t("tokenNotSpecified") });
      setLoading(false);
      return;
    }

    const encodedToken = encodeURIComponent(token);
    fetch(`/api/auth/verify-token?token=${encodedToken}`)
      .then((res) => res.json())
      .then((data) => {
        setVerification(data);
        setLoading(false);
      })
      .catch(() => {
        setVerification({ valid: false, error: t("tokenVerificationFailed") });
        setLoading(false);
      });
  }, [token, t]);

  if (loading) {
    return <LoadingFallback />;
  }

  if (!verification || !verification.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted px-4">
        <div className="w-full max-w-md">
          <InvalidTokenMessage error={verification?.error || t("invalidToken")} />
        </div>
      </div>
    );
  }

  // verificationがvalidでここまで来ているなら、token, username, emailは必ず存在する
  if (!token || !verification.username || !verification.email) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted px-4">
      <div className="w-full max-w-md">
        <SetPasswordForm
          token={token}
          username={verification.username}
          email={verification.email}
        />
      </div>
    </div>
  );
}

export default function FirstLoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <FirstLoginContent />
    </Suspense>
  );
}
