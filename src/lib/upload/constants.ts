/**
 * アップロード機能の定数管理
 *
 * WHY: 用途別のファイルサイズ制限を一元管理することで、
 * 変更時の修正箇所を1箇所に集約し、保守性を向上させるため
 */

import { ALLOWED_IMAGE_MIME_TYPES } from "./image-validation";

/**
 * 記事画像アップロードの制限
 */
export const ARTICLE_IMAGE_UPLOAD = {
  /** 最大ファイルサイズ: 5MB */
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  /** 許可されるMIMEタイプ */
  ALLOWED_MIME_TYPES: ALLOWED_IMAGE_MIME_TYPES,
  /** エラーメッセージ */
  ERROR_MESSAGES: {
    SIZE_EXCEEDED: "画像サイズは5MB以下にしてください",
    INVALID_TYPE: "JPEG、PNG、GIF、WebP形式の画像を選択してください",
  },
} as const;

/**
 * アバター画像アップロードの制限
 */
export const AVATAR_IMAGE_UPLOAD = {
  /** 最大ファイルサイズ: 2MB（マイページは控えめに設定） */
  MAX_FILE_SIZE: 2 * 1024 * 1024,
  /** 許可されるMIMEタイプ */
  ALLOWED_MIME_TYPES: ALLOWED_IMAGE_MIME_TYPES,
  /** エラーメッセージ */
  ERROR_MESSAGES: {
    SIZE_EXCEEDED: "画像サイズは2MB以下にしてください",
    INVALID_TYPE: "JPEG、PNG、GIF、WebP形式の画像を選択してください",
  },
} as const;
