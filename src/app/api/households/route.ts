import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/butterbase";
import { wrapList, unwrapList } from "@/lib/jsonb";
import { getUser } from "@/lib/session";

function normalize(row: Record<string, unknown>) {
  return {
    ...row,
    concerns: unwrapList(row.concerns),
    vulnerabilities: unwrapList(row.vulnerabilities),
  };
}

export async function GET() {
  const session = await getUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await db.select<Record<string, unknown>>(
    "households",
    "order=created_at.desc",
    session.token
  );
  return NextResponse.json({ households: rows.map(normalize) });
}

export async function POST(req: NextRequest) {
  const session = await getUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { address, concerns, vulnerabilities } = await req.json();
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });

  // Demo graph maps every address to the seeded Oakland property that best matches
  const propertyId = pickDemoProperty(address);
  const row = await db.insert<Record<string, unknown>>(
    "households",
    {
      user_id: session.user.id,
      address,
      property_id: propertyId,
      concerns: wrapList(concerns ?? []),
      vulnerabilities: wrapList(vulnerabilities ?? []),
    },
    session.token
  );
  return NextResponse.json({ household: normalize(row) });
}

function pickDemoProperty(address: string): string {
  const a = address.toLowerCase();
  if (a.includes("skyline") || a.includes("hills")) return "prop-2";
  if (a.includes("66th") || a.includes("flood")) return "prop-3";
  return "prop-1";
}
