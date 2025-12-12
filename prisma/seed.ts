import { prisma } from "../src/lib/prisma";
import bcrypt from "bcrypt";

async function main() {
  console.log("シードデータの投入を開始します...");

  // 環境変数から管理者情報を取得
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";

  // パスワードをハッシュ化
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  // 既存の管理者ユーザーをチェック
  const existingUser = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (existingUser) {
    console.log(`管理者ユーザー "${adminUsername}" は既に存在します`);
  } else {
    // 管理者ユーザーを作成
    const admin = await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        role: "admin",
      },
    });

    console.log(`管理者ユーザー "${admin.username}" を作成しました`);
  }

	// デフォルトカレンダーを作成（複数カレンダー対応）
	const user = await prisma.user.findUnique({
		where: { username: adminUsername },
	});

	if (!user) {
		throw new Error("管理者ユーザーが見つかりません");
	}

	let defaultCalendar = await prisma.calendar.findFirst({
		where: { slug: "advent-2025" },
	});

	if (!defaultCalendar) {
		console.log("デフォルトカレンダーを作成します...");
		defaultCalendar = await prisma.calendar.create({
			data: {
				name: "アドベントカレンダー 2025",
				year: 2025,
				slug: "advent-2025",
				description: "エンジニア向けアドベントカレンダー - 毎日技術記事を公開",
				isPublished: true,
				createdById: user.id,
			},
		});
		console.log(`カレンダー "${defaultCalendar.name}" を作成しました`);
	} else {
		console.log(`カレンダー "${defaultCalendar.name}" は既に存在します`);
	}

	// 開発用のサンプル記事を作成（任意）
	const articleCount = await prisma.article.count();

	if (articleCount === 0) {
		console.log("サンプル記事を作成します...");

		// タグを作成
		const tag1 = await prisma.tag.create({
			data: {
				name: "Next.js",
				slug: "nextjs",
			},
		});

		const tag2 = await prisma.tag.create({
			data: {
				name: "TypeScript",
				slug: "typescript",
			},
		});

		// サンプル記事1
		await prisma.article.create({
			data: {
				title: "アドベントカレンダーへようこそ！",
				content: `# アドベントカレンダーへようこそ！

このサイトは、12月1日から25日までの技術記事を公開するアドベントカレンダーサイトです。

## 技術スタック

- **フロントエンド**: Next.js 14, React 18, TypeScript
- **スタイリング**: Tailwind CSS, shadcn/ui
- **データベース**: Prisma ORM + SQLite/PostgreSQL
- **認証**: NextAuth.js

## 今後の予定

毎日新しい技術記事を公開していきます。お楽しみに！
`,
				date: 1,
				status: "published",
				calendarId: defaultCalendar.id,
				authorId: user.id,
				publishedAt: new Date(),
				tags: {
					connect: [{ id: tag1.id }, { id: tag2.id }],
				},
			},
		});

		// サンプル記事2（下書き）
		await prisma.article.create({
			data: {
				title: "Next.js App Routerの基礎",
				content: `# Next.js App Routerの基礎

Next.js 13から導入されたApp Routerについて解説します。

## Server ComponentsとClient Components

（執筆中...）
`,
				date: 2,
				status: "draft",
				calendarId: defaultCalendar.id,
				authorId: user.id,
				tags: {
					connect: [{ id: tag1.id }],
				},
			},
		});

		console.log("サンプル記事を2件作成しました");
  } else {
    console.log("記事は既に存在します。スキップします。");
  }

  console.log("シードデータの投入が完了しました！");
}

main()
  .catch((e) => {
    console.error("エラーが発生しました:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
