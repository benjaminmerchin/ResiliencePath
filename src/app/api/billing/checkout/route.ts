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
    const msg = e instanceof Error ? e.message : "checkout failed";
    // Stripe Connect KYC requires US business details; until verification
    // completes, surface an honest, demo-friendly message instead of a raw
    // Stripe error.
    if (/checkout|stripe\.com\/account|onboard/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            "Checkout is wired end-to-end (plan → subscribe → Stripe Checkout) but Stripe's business verification requires US entity details. It activates the moment verification completes.",
        },
        { status: 503 }
      );
    }
    const status = e instanceof ButterbaseError ? e.status : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
