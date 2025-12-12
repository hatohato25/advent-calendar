// Calendar型（基本）
export type Calendar = {
  id: string;
  name: string;
  year: number;
  slug: string;
  description: string | null;
  isPublished: boolean;
  theme: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

// Calendar with createdBy relation
export type CalendarWithCreatedBy = Calendar & {
  createdBy: {
    id: string;
    username: string;
  };
};

// Calendar with article count (for management list)
export type CalendarWithStats = Calendar & {
  articleCount: number;
  createdBy: {
    id: string;
    username: string;
  };
};

// Calendar with articles (for public pages)
export type CalendarWithArticles = Calendar & {
  articles: Array<{
    id: string;
    title: string;
    date: number;
    status: string;
    author: {
      id: string;
      username: string;
    };
    tags: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  }>;
};

// Calendar form data (for create/update)
export type CalendarFormData = {
  name: string;
  year: number;
  slug: string;
  description?: string;
  isPublished?: boolean;
  theme?: string;
};

// Calendar update data (slug and year are not editable)
export type CalendarUpdateData = Omit<CalendarFormData, "slug" | "year">;

// Prisma select type for calendar list
// satisfies Prisma.CalendarSelect は使用できないため、as const で型推論
export const calendarListSelect = {
  id: true,
  name: true,
  year: true,
  slug: true,
  description: true,
  isPublished: true,
  theme: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: {
      id: true,
      username: true,
    },
  },
  _count: {
    select: {
      articles: true,
    },
  },
} as const;

// Prisma select type for calendar detail
export const calendarDetailSelect = {
  id: true,
  name: true,
  year: true,
  slug: true,
  description: true,
  isPublished: true,
  theme: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: {
      id: true,
      username: true,
    },
  },
} as const;
