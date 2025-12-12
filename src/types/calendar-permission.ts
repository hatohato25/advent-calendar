/**
 * カレンダー権限の型定義
 * Phase 2: 高度な権限管理で使用
 */

/**
 * カレンダー権限（API レスポンス用）
 */
export interface CalendarPermission {
  id: string;
  userId: string;
  calendarId: string;
  calendar: {
    id: string;
    name: string;
    year: number;
    slug: string;
  };
  allowedDates: number[]; // JSON.parseされた配列
  createdAt: string;
  updatedAt: string;
}

/**
 * カレンダー権限作成時の入力型
 */
export interface CreateCalendarPermissionInput {
  calendarId: string;
  allowedDates: number[];
}

/**
 * カレンダー権限更新時の入力型
 */
export interface UpdateCalendarPermissionInput {
  allowedDates: number[];
}

/**
 * カレンダー権限一覧取得APIのレスポンス
 */
export interface GetCalendarPermissionsResponse {
  permissions: CalendarPermission[];
}

/**
 * カレンダー権限作成APIのレスポンス
 */
export interface CreateCalendarPermissionResponse {
  permission: CalendarPermission;
}

/**
 * カレンダー権限更新APIのレスポンス
 */
export interface UpdateCalendarPermissionResponse {
  permission: CalendarPermission;
}
