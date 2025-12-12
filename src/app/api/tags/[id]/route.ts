import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 個別タグAPI
 * DELETE: タグ削除
 */

/**
 * DELETE /api/tags/[id]
 * タグを削除（未使用のタグのみ）
 * 認証必須
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 認証チェック
    await requireAuth();

    const { id } = await params;

    // タグの存在確認
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    if (!tag) {
      return NextResponse.json({ error: "タグが見つかりません" }, { status: 404 });
    }

    // 記事で使用中のタグは削除できない
    if (tag._count.articles > 0) {
      return NextResponse.json(
        { error: "このタグは記事で使用されているため削除できません" },
        { status: 400 },
      );
    }

    // タグ削除
    await prisma.tag.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    return handleApiError(error, "DELETE /api/tags/:id", "タグの削除に失敗しました");
  }
}
