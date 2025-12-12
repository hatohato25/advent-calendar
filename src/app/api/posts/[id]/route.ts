import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api/error-handler";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 個別記事取得API
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        tags: true,
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        calendar: {
          select: {
            id: true,
            name: true,
            slug: true,
            year: true,
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json({ error: "記事が見つかりません" }, { status: 404 });
    }

    // 下書き記事は認証が必要
    if (article.status === "draft") {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
      }
    }

    return NextResponse.json({ article });
  } catch (error) {
    return handleApiError(error, "GET /api/posts/:id", "記事の取得に失敗しました");
  }
}

/**
 * 記事更新API
 * 認証必須
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 認証チェック
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // バリデーションスキーマ（部分更新対応）
    const articleUpdateSchema = z.object({
      title: z.string().min(1).max(200).optional(),
      content: z.string().min(1).optional(),
      date: z.number().int().min(1).max(25).optional(),
      tags: z.array(z.string()).max(10).optional(),
      status: z.enum(["draft", "published"]).optional(),
    });

    const validatedData = articleUpdateSchema.parse(body);

    // 既存記事の存在確認
    const existingArticle = await prisma.article.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "記事が見つかりません" }, { status: 404 });
    }

    // 権限チェック: editorは自分の記事かつカレンダー内の許可された日程のみ編集可能
    const { canEditArticleInCalendar } = await import("@/lib/auth");
    if (session.user.role !== "admin") {
      // 自分の記事かチェック
      if (existingArticle.authorId !== session.user.id) {
        return NextResponse.json({ error: "この記事を編集する権限がありません" }, { status: 403 });
      }
      // カレンダー内の日程の権限チェック（現在の日程）
      const canEditCurrent = await canEditArticleInCalendar(
        session.user.id,
        existingArticle.calendarId,
        existingArticle.date,
      );
      if (!canEditCurrent) {
        return NextResponse.json({ error: "この記事を編集する権限がありません" }, { status: 403 });
      }
      // 日程を変更する場合は、新しい日程の権限もチェック
      if (validatedData.date && validatedData.date !== existingArticle.date) {
        const canEditNew = await canEditArticleInCalendar(
          session.user.id,
          existingArticle.calendarId,
          validatedData.date,
        );
        if (!canEditNew) {
          return NextResponse.json(
            { error: "変更先の日程に対する権限がありません" },
            { status: 403 },
          );
        }
      }
    }

    // 日付の重複チェック（自分以外、同じカレンダー内）
    if (validatedData.date && validatedData.date !== existingArticle.date) {
      const duplicateArticle = await prisma.article.findUnique({
        where: {
          calendarId_date: {
            calendarId: existingArticle.calendarId,
            date: validatedData.date,
          },
        },
      });

      if (duplicateArticle) {
        return NextResponse.json({ error: "この日付には既に記事が存在します" }, { status: 409 });
      }
    }

    // タグの処理
    let tagRecords = existingArticle.tags;
    if (validatedData.tags) {
      tagRecords = await Promise.all(
        validatedData.tags.map(async (tagName) => {
          const slug = tagName.toLowerCase().replace(/\s+/g, "-");
          return await prisma.tag.upsert({
            where: { name: tagName },
            update: { slug },
            create: {
              name: tagName,
              slug,
            },
          });
        }),
      );
    }

    // ステータスが公開に変更された場合、publishedAtを設定
    // 公開済みの記事を再度公開ステータスで保存する場合は既存のpublishedAtを維持
    const shouldSetPublishedAt =
      validatedData.status === "published" && existingArticle.status !== "published";
    const shouldKeepPublishedAt =
      validatedData.status === "published" && existingArticle.status === "published";

    let publishedAtData = {};
    if (shouldSetPublishedAt) {
      // 下書きから公開に変更: 現在時刻を設定
      publishedAtData = { publishedAt: new Date() };
    } else if (shouldKeepPublishedAt) {
      // 公開済みを公開のまま維持: 既存のpublishedAtを保持（変更しない）
      // 何もしない（updateデータに含めない）
    } else if (validatedData.status === "draft") {
      // 公開から下書きに変更: publishedAtをnullにリセット
      publishedAtData = { publishedAt: null };
    }

    // 記事更新
    const article = await prisma.article.update({
      where: { id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.content && { content: validatedData.content }),
        ...(validatedData.date && { date: validatedData.date }),
        ...(validatedData.status && { status: validatedData.status }),
        ...publishedAtData,
        ...(validatedData.tags && {
          tags: {
            set: [],
            connect: tagRecords.map((tag) => ({ id: tag.id })),
          },
        }),
      },
      include: {
        tags: true,
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // ISR再検証をトリガー
    // ステータスが公開になった場合、または既に公開済みで内容を更新した場合
    if (article.status === "published") {
      revalidatePath("/");
      revalidatePath(`/posts/${article.date}`);
      // 日付が変更された場合は、旧日付のページも再検証
      if (validatedData.date && validatedData.date !== existingArticle.date) {
        revalidatePath(`/posts/${existingArticle.date}`);
      }
    }

    return NextResponse.json({ article });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("バリデーションエラー:", error.issues);
      return NextResponse.json(
        {
          error: "バリデーションエラー",
          details: error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      );
    }

    return handleApiError(error, "PUT /api/posts/:id", "記事の更新に失敗しました");
  }
}

/**
 * 記事削除API
 * 認証必須
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // 認証チェック
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    // 記事の存在確認
    const existingArticle = await prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "記事が見つかりません" }, { status: 404 });
    }

    // 権限チェック: editorは自分の記事かつカレンダー内の許可された日程のみ削除可能
    const { canEditArticleInCalendar } = await import("@/lib/auth");
    if (session.user.role !== "admin") {
      // 自分の記事かチェック
      if (existingArticle.authorId !== session.user.id) {
        return NextResponse.json({ error: "この記事を削除する権限がありません" }, { status: 403 });
      }
      // カレンダー内の日程の権限チェック
      const canDelete = await canEditArticleInCalendar(
        session.user.id,
        existingArticle.calendarId,
        existingArticle.date,
      );
      if (!canDelete) {
        return NextResponse.json({ error: "この記事を削除する権限がありません" }, { status: 403 });
      }
    }

    // 記事削除（タグとのリレーションも自動削除される）
    await prisma.article.delete({
      where: { id },
    });

    // ISR再検証をトリガー
    // 公開済み記事を削除した場合は、カレンダーと記事ページを再検証
    if (existingArticle.status === "published") {
      revalidatePath("/");
      revalidatePath(`/posts/${existingArticle.date}`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, "DELETE /api/posts/:id", "記事の削除に失敗しました");
  }
}
