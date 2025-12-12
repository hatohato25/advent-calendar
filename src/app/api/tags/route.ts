import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * タグAPI
 * GET: 全タグ取得（記事数を含む）
 * POST: タグ作成
 */

/**
 * GET /api/tags
 * 全タグを記事数とともに取得
 */
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // レスポンス形式を整形
    const tagsWithCount = tags.map((tag: (typeof tags)[0]) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      articleCount: tag._count.articles,
      createdAt: tag.createdAt,
    }));

    return NextResponse.json({ tags: tagsWithCount });
  } catch (error) {
    return handleApiError(error, "GET /api/tags", "タグの取得に失敗しました");
  }
}

/**
 * POST /api/tags
 * 新しいタグを作成
 * 認証必須
 */
export async function POST(request: Request) {
  try {
    // 認証チェック
    await requireAuth();

    const body = await request.json();
    const { name } = body;

    // バリデーション
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "タグ名が必要です" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // slug生成（小文字化、スペースをハイフンに）
    const slug = trimmedName.toLowerCase().replace(/\s+/g, "-");

    // 既存タグの確認
    const existingTag = await prisma.tag.findUnique({
      where: { slug },
    });

    if (existingTag) {
      return NextResponse.json({ error: "このタグは既に存在します" }, { status: 409 });
    }

    // タグ作成
    const tag = await prisma.tag.create({
      data: {
        name: trimmedName,
        slug,
      },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    return handleApiError(error, "POST /api/tags", "タグの作成に失敗しました");
  }
}
