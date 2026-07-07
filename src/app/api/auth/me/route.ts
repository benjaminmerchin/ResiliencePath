import { NextResponse } from "next/server";
import { getUser } from "@/lib/session";

export async function GET() {
  const session = await getUser();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: session.user });
}
