import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

/**
 * @/i18n/routing からの redirect インポートを next/navigation に戻すスクリプト
 * WHY: Server Componentsでのredirectは通常のnext/navigationを使用する必要がある
 */

function fixRedirectInFile(filePath: string): boolean {
  const content = readFileSync(filePath, "utf-8");
  let modified = false;
  let newContent = content;

  // @/i18n/routing からの redirect インポートを確認
  const hasI18nRedirect = content.includes('redirect') && content.includes('from "@/i18n/routing"');

  if (hasI18nRedirect) {
    // インポート文を解析
    const importPattern = /import\s+{([^}]+)}\s+from\s+"@\/i18n\/routing";/g;
    const matches = [...content.matchAll(importPattern)];

    for (const match of matches) {
      const imports = match[1];
      const importsList = imports.split(",").map((i) => i.trim());

      // redirect を分離
      const withoutRedirect = importsList.filter((imp) => imp !== "redirect");
      const hasRedirect = importsList.includes("redirect");

      if (hasRedirect) {
        let replacement = "";

        // redirect は next/navigation から
        replacement += 'import { redirect } from "next/navigation";\n';

        // その他のインポートは @/i18n/routing から
        if (withoutRedirect.length > 0) {
          replacement += `import { ${withoutRedirect.join(", ")} } from "@/i18n/routing";`;
        }

        newContent = newContent.replace(match[0], replacement.trim());
        modified = true;
      }
    }
  }

  if (modified) {
    writeFileSync(filePath, newContent, "utf-8");
    console.log(`✓ Fixed: ${filePath}`);
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
      if (entry === "node_modules" || entry === ".next") {
        continue;
      }
      count += processDirectory(fullPath);
    } else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
      if (fixRedirectInFile(fullPath)) {
        count++;
      }
    }
  }

  return count;
}

const srcDir = join(process.cwd(), "src");
const updatedCount = processDirectory(srcDir);

console.log(`\n合計 ${updatedCount} ファイルを修正しました。`);
