import type { Tag as PrismaTag } from "@prisma/client";

// Prismaの生成型をそのまま使用
export type Tag = PrismaTag;

// タグ作成時の入力型
export type TagCreateInput = {
  name: string;
  slug: string;
};

// フィルタリング用の簡易タグ型
export type TagSimple = {
  id: string;
  name: string;
  slug: string;
};

// タグと記事数を含む型
export type TagWithCount = Tag & {
  _count: {
    articles: number;
  };
};
