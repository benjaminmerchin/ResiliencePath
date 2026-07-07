import { NextRequest, NextResponse } from "next/server";
import { getCommunityImpact } from "@/lib/queries";
import { getUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const propertyId = req.nextUrl.searchParams.get("propertyId") ?? "prop-1";
  const impact = await getCommunityImpact(propertyId);
  return NextResponse.json({ impact });
}
