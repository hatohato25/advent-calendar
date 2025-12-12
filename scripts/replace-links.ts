import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

/**
 * next/link と next/navigation からのインポートを @/i18n/routing に置き換えるスクリプト
 */

function replaceImportsInFile(filePath: string): boolean {
  const content = readFileSync(filePath, "utf-8");
  let modified = false;
  let newContent = content;

  // next/link からの Link インポートを置き換え
  if (content.includes('from "next/link"')) {
    newContent = newContent.replace(/import Link from "next\/link";/g, 'import { Link } from "@/i18n/routing";');
    modified = true;
  }

  // next/navigation からのインポートを置き換え（useRouter, usePathname, redirect など）
  const navigationImportPattern = /import\s+{([^}]+)}\s+from\s+"next\/navigation";/g;
  const matches = content.matchAll(navigationImportPattern);

  for (const match of matches) {
    const imports = match[1];
    const importsList = imports.split(",").map((i) => i.trim());

    // i18nルーティングで使用可能なインポート
    const routingImports = ["Link", "useRouter", "usePathname", "redirect", "getPathname"];
    const routingMatches = importsList.filter((imp) => routingImports.includes(imp));
    const otherImports = importsList.filter((imp) => !routingImports.includes(imp));

    if (routingMatches.length > 0) {
      let replacement = "";
      if (routingMatches.length > 0) {
        replacement += `import { ${routingMatches.join(", ")} } from "@/i18n/routing";\n`;
      }
      if (otherImports.length > 0) {
        replacement += `import { ${otherImports.join(", ")} } from "next/navigation";`;
      }

      newContent = newContent.replace(match[0], replacement.trim());
      modified = true;
    }
  }

  if (modified) {
    writeFileSync(filePath, newContent, "utf-8");
    console.log(`✓ Updated: ${filePath}`);
  }

  return modified;
}

function processDirectory(dir: string): number {
  let count = 0;
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // node_modules と .next ディレクトリはスキップ
      if (entry === "node_modules" || entry === ".next") {
        continue;
      }
      count += processDirectory(fullPath);
    } else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
      if (replaceImportsInFile(fullPath)) {
        count++;
      }
    }
  }

  return count;
}

const srcDir = join(process.cwd(), "src");
const updatedCount = processDirectory(srcDir);

console.log(`\n合計 ${updatedCount} ファイルを更新しました。`);
