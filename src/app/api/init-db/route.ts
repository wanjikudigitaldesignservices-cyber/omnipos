import { NextResponse } from "next/server";
import { ensureDatabaseTables } from "@/db/init";

export async function GET() {
  const result = await ensureDatabaseTables();
  return NextResponse.json(result);
}

export async function POST() {
  const result = await ensureDatabaseTables();
  return NextResponse.json(result);
}
