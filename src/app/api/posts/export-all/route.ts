import matter from "gray-matter";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 全記事をまとめてエクスポート
 * GET /api/posts/export-all
 */
export async function GET() {
  try {
    // 認証チェック
    await requireAuth();

    // すべての記事を取得
    const articles = await prisma.article.findMany({
      include: {
        tags: true,
        author: {
          select: {
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    if (articles.length === 0) {
      return NextResponse.json({ error: "エクスポートする記事がありません" }, { status: 404 });
    }

    // 各記事をMarkdown形式に変換
    const markdowns = articles.map((article) => {
      const frontmatter = {
        title: article.title,
        date: article.date,
        status: article.status,
        tags: article.tags.map((tag) => tag.name),
        author: article.author.username,
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
        publishedAt: article.publishedAt?.toISOString() || null,
      };

      const filename = `${article.date.toString().padStart(2, "0")}-${article.title
        .replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, "-")
        .substring(0, 50)}.md`;

      return {
        filename,
        content: matter.stringify(article.content, frontmatter),
      };
    });

    // ZIPファイルとして提供することも可能だが、簡易的にJSON形式で返す
    // クライアント側で個別にダウンロード処理を行う
    return NextResponse.json({
      count: articles.length,
      files: markdowns,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    return handleApiError(error, "GET /api/posts/export-all", "記事のエクスポートに失敗しました");
  }
}
