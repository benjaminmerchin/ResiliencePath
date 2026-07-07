import { NextResponse } from "next/server";
import { billing } from "@/lib/butterbase";
import { getUser } from "@/lib/session";

export async function GET() {
  const session = await getUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const [subscription, plans] = await Promise.all([
      billing.subscription(session.token).catch(() => null),
      billing.listPlans().catch(() => []),
    ]);
    return NextResponse.json({ subscription, plans });
  } catch {
    return NextResponse.json({ subscription: null, plans: [] });
  }
}
