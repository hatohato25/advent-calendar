import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";

/**
 * 404 Not Foundページ
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <FileQuestion className="h-6 w-6" />
            <CardTitle>ページが見つかりません</CardTitle>
          </div>
          <CardDescription>
            お探しのページは存在しないか、移動された可能性があります
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-8 text-center">
            <p className="text-6xl font-bold text-muted-foreground mb-2">404</p>
            <p className="text-sm text-muted-foreground">Not Found</p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/">トップページへ</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin">管理ページへ</Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              URLが正しいか確認してください。
              <br />
              記事は12月1日から25日までの日付でアクセスできます。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
