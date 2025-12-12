/**
 * 食物絵文字ユーティリティ
 *
 * WHY: カレンダー名に食物絵文字を追加して視覚的な識別性を向上させる
 */

/**
 * 食物絵文字の一覧
 * 70種類の食べ物・飲み物の絵文字から選択可能
 */
const FOOD_EMOJIS = [
  "🍎",
  "🍊",
  "🍋",
  "🍌",
  "🍉",
  "🍇",
  "🍓",
  "🍑",
  "🍒",
  "🥝",
  "🍅",
  "🥕",
  "🌽",
  "🥒",
  "🥦",
  "🍆",
  "🥔",
  "🍠",
  "🥐",
  "🥖",
  "🥨",
  "🥯",
  "🧀",
  "🥚",
  "🍳",
  "🥞",
  "🧇",
  "🥓",
  "🍔",
  "🍟",
  "🍕",
  "🌭",
  "🥪",
  "🌮",
  "🌯",
  "🥙",
  "🧆",
  "🥗",
  "🍝",
  "🍜",
  "🍲",
  "🍛",
  "🍣",
  "🍱",
  "🥟",
  "🍤",
  "🍙",
  "🍚",
  "🍘",
  "🍥",
  "🥠",
  "🥮",
  "🍢",
  "🍡",
  "🍧",
  "🍨",
  "🍦",
  "🥧",
  "🧁",
  "🍰",
  "🎂",
  "🍮",
  "🍭",
  "🍬",
  "🍫",
  "🍿",
  "🍩",
  "🍪",
  "🌰",
  "🥜",
] as const;

/**
 * ランダムな食物絵文字を取得
 *
 * @returns ランダムに選ばれた食物絵文字
 */
export function getRandomFoodEmoji(): string {
  const randomIndex = Math.floor(Math.random() * FOOD_EMOJIS.length);
  return FOOD_EMOJIS[randomIndex];
}

/**
 * テキストに絵文字を追加（統一関数）
 * 既に絵文字が含まれている場合は追加しない
 *
 * WHY: カレンダー名と記事タイトルで同じロジックを使用していたため統一
 * 絵文字の重複チェックと追加の処理を一箇所で管理
 *
 * @param text - 元のテキスト
 * @returns 絵文字が追加されたテキスト（既に絵文字がある場合はそのまま）
 */
export function addEmojiIfMissing(text: string): string {
  // 文字列の先頭に絵文字が含まれているかチェック
  // 絵文字のUnicode範囲でマッチ
  const emojiRegex = /^[\p{Emoji_Presentation}\p{Emoji}\u200D]+/u;

  if (emojiRegex.test(text)) {
    // 既に絵文字がある場合はそのまま返す
    return text;
  }

  // 絵文字を追加
  const emoji = getRandomFoodEmoji();
  return `${emoji} ${text}`;
}

/**
 * カレンダー名に絵文字を追加
 * WHY: 後方互換性のためのエイリアス関数
 * 既存コードを段階的に移行できるようにする
 *
 * @deprecated 今後は addEmojiIfMissing を使用してください
 */
export const addEmojiToCalendarName = addEmojiIfMissing;

/**
 * 記事タイトルに絵文字を追加
 * WHY: 後方互換性のためのエイリアス関数
 * 既存コードを段階的に移行できるようにする
 *
 * @deprecated 今後は addEmojiIfMissing を使用してください
 */
export const addEmojiToPostTitle = addEmojiIfMissing;

/**
 * テキストから最初の絵文字を抽出
 * カレンダーグリッドのアバター表示に使用
 *
 * WHY: 記事タイトルから絵文字を抽出してカレンダーグリッドで視覚的に表示
 *
 * @param text - 絵文字を含むテキスト
 * @returns 最初の絵文字（存在しない場合はnull）
 */
export function extractFirstEmoji(text: string): string | null {
  // 絵文字のUnicode範囲でマッチ
  // WHY: \p{Emoji}だけでは一部の絵文字がマッチしないため、複数のUnicode範囲を指定
  const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\u200D]/u;
  const match = text.match(emojiRegex);
  return match ? match[0] : null;
}
