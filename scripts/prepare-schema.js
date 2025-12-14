#!/usr/bin/env node

/**
 * Prisma schemaのproviderを環境に応じて動的に書き換えるスクリプト
 *
 * 環境変数DATABASE_URLの値に応じてproviderを設定:
 * - postgresql:// で始まる場合 → provider = "postgresql"
 * - file: で始まる場合 → provider = "sqlite"
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

// DATABASE_URLからproviderを判定
let provider = 'sqlite';
if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
  provider = 'postgresql';
} else if (databaseUrl.startsWith('file:') || databaseUrl.startsWith('libsql://')) {
  provider = 'sqlite';
}

console.log(`📝 Preparing Prisma schema...`);
console.log(`   DATABASE_URL: ${databaseUrl.substring(0, 30)}...`);
console.log(`   Detected provider: ${provider}`);

// schema.prismaを読み込み
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// datasource dbブロック内のproviderを書き換え
// 正規表現で datasource db { ... } ブロックを見つけて、その中のproviderを置換
const datasourceRegex = /(datasource\s+db\s*\{[^}]*provider\s*=\s*)"[^"]*"/;
schemaContent = schemaContent.replace(datasourceRegex, `$1"${provider}"`);

// 書き込み
fs.writeFileSync(schemaPath, schemaContent, 'utf8');

console.log(`✅ Schema provider set to: ${provider}`);
