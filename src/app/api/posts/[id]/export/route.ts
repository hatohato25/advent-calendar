import matter from "gray-matter";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 記事をMarkdownファイルとしてエクスポート
 * GET /api/posts/[id]/export
 */
export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    // 認証チェック（下書きもエクスポート可能にするため）
    await requireAuth();

    const params = await props.params;
    const { id } = params;

    // 記事を取得
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        tags: true,
        author: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json({ error: "記事が見つかりません" }, { status: 404 });
    }

    // フロントマター形式でMarkdownを生成
    const frontmatter = {
      title: article.title,
      date: article.date,
      status: article.status,
      tags: article.tags.map((tag: (typeof article.tags)[0]) => tag.name),
      author: article.author.username,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      publishedAt: article.publishedAt?.toISOString() || null,
    };

    const markdown = matter.stringify(article.content, frontmatter);

    // ファイル名を生成（日付とタイトルから）
    const filename = `${article.date.toString().padStart(2, "0")}-${article.title
      .replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, "-")
      .substring(0, 50)}.md`;

    // Markdownファイルとしてダウンロード
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    return handleApiError(error, "GET /api/posts/:id/export", "記事のエクスポートに失敗しました");
  }
}
