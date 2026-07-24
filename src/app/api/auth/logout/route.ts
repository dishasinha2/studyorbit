import { NextResponse } from "next/server";
import { clearServerSession } from "@/lib/auth-cookie";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearServerSession(response);
  return response;
}

