import jaMessages from "../messages/ja.json";
import enMessages from "../messages/en.json";

/**
 * 翻訳ファイルのキー整合性チェックスクリプト
 * ja.json と en.json のキーが一致しているか確認
 */

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.keys(obj).reduce((keys: string[], key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return keys.concat(flattenKeys(value as Record<string, unknown>, fullKey));
    }

    return keys.concat(fullKey);
  }, []);
}

const jaKeys = flattenKeys(jaMessages).sort();
const enKeys = flattenKeys(enMessages).sort();

// キーの差分チェック
const missingInEn = jaKeys.filter((key) => !enKeys.includes(key));
const missingInJa = enKeys.filter((key) => !jaKeys.includes(key));

let hasError = false;

if (missingInEn.length > 0) {
  console.error("\n❌ 以下のキーが en.json に存在しません:");
  for (const key of missingInEn) {
    console.error(`  - ${key}`);
  }
  hasError = true;
}

if (missingInJa.length > 0) {
  console.error("\n❌ 以下のキーが ja.json に存在しません:");
  for (const key of missingInJa) {
    console.error(`  - ${key}`);
  }
  hasError = true;
}

if (hasError) {
  console.error("\n❌ 翻訳キーの整合性チェックに失敗しました。\n");
  process.exit(1);
}

console.log("✅ 翻訳キーの整合性チェックが成功しました。");
console.log(`   - 日本語: ${jaKeys.length} キー`);
console.log(`   - 英語: ${enKeys.length} キー`);
