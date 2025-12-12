import { NextResponse } from "next/server";

export async function POST() {
  // NextAuth.jsのsignOut処理は自動的に処理されるため、
  // このエンドポイントは明示的なログアウト処理用に残す
  return NextResponse.json({ success: true });
}
