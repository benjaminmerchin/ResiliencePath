import { NextRequest, NextResponse } from "next/server";
import { billing, ButterbaseError } from "@/lib/butterbase";
import { getUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { planId } = await req.json();
    const origin = req.nextUrl.origin;
    const { url } = await billing.subscribe(
      session.token,
      planId,
      `${origin}/dashboard?upgraded=1`,
      `${origin}/dashboard?canceled=1`
    );
    return NextResponse.json({ url });
  } catch (e) {
    const status = e instanceof ButterbaseError ? e.status : 500;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "checkout failed" },
      { status }
    );
  }
}
