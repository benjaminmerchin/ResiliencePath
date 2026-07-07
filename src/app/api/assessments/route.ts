import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/butterbase";
import { getUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const householdId = req.nextUrl.searchParams.get("householdId");
  const filter = householdId
    ? `household_id=eq.${householdId}&order=created_at.desc`
    : "order=created_at.desc";
  const rows = await db.select("assessments", filter, session.token);
  return NextResponse.json({ assessments: rows });
}
