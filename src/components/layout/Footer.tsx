import { Github } from "lucide-react";
import { Link } from "@/i18n/routing";

/**
 * サイトフッター
 * コピーライトと外部リンクを表示
 */
export function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-8 md:h-20 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
          <p className="text-center text-sm leading-loose text-muted-foreground">
            © 2025 アドベントカレンダー. All rights reserved.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="GitHub"
          >
            <Github className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
