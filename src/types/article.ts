import type { Article as PrismaArticle, Tag, User } from "@prisma/client";

// Prismaの生成型をそのまま使用
export type Article = PrismaArticle;

// 記事ステータスの型（型安全性向上）
export type ArticleStatus = "draft" | "published";

// タグを含む記事型
export type ArticleWithTags = Article & {
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
  author?: {
    id: string;
    username: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  calendar?: {
    id: string;
    name: string;
    slug: string;
    year: number;
  };
  calendarId: string; // カレンダーID（複数カレンダー対応）
};

// 著者を含む記事型
export type ArticleWithAuthor = Article & {
  author: Omit<User, "passwordHash">;
};

// タグと著者を含む記事型
export type ArticleWithRelations = Article & {
  tags: Tag[];
  author: Omit<User, "passwordHash">;
};

// 一覧表示用の記事型
export type ArticleListItem = {
  id: string;
  title: string;
  date: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
  author?: {
    id: string;
    username: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

// 記事作成時の入力型
export type ArticleCreateInput = {
  title: string;
  content: string;
  date: number;
  status: ArticleStatus;
  tags: string[]; // タグ名の配列
  authorId: string;
  calendarId: string; // カレンダーID（複数カレンダー対応）
};

// 記事更新時の入力型（部分更新対応）
export type ArticleUpdateInput = Partial<{
  title: string;
  content: string;
  date: number;
  status: ArticleStatus;
  tags: string[];
  publishedAt: Date | null;
}>;
