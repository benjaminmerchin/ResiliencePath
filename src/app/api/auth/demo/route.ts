import { NextResponse } from "next/server";
import { auth, ButterbaseError } from "@/lib/butterbase";
import { setSession } from "@/lib/session";

// One-click demo login for judges: pre-seeded household + completed assessment.
const DEMO_EMAIL = "demo@resiliencepath.app";
const DEMO_PASSWORD = "Demo!Passw0rd42";

export async function POST() {
  try {
    const session = await auth.signIn(DEMO_EMAIL, DEMO_PASSWORD);
    await setSession(session);
    return NextResponse.json({ user: session.user });
  } catch (e) {
    const status = e instanceof ButterbaseError ? e.status : 500;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "demo login failed" },
      { status }
    );
  }
}
