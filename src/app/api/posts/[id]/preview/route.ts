import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * プレビュー用API
 * 認証されたユーザーは下書き記事もプレビュー可能
 * GET /api/posts/[id]/preview
 */
export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    // 認証チェック（プレビューには認証が必要）
    await requireAuth();

    const params = await props.params;
    const { id } = params;

    // 記事を取得（下書きも含む）
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        tags: true,
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json({ error: "記事が見つかりません" }, { status: 404 });
    }

    // 記事データを返す
    return NextResponse.json({
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
        date: article.date,
        status: article.status,
        tags: article.tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
        })),
        author: {
          username: article.author.username,
        },
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
        publishedAt: article.publishedAt?.toISOString() || null,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    return handleApiError(error, "GET /api/posts/:id/preview", "プレビューの取得に失敗しました");
  }
}
