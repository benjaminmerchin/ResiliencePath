import { NextRequest, NextResponse } from "next/server";
import { auth, ButterbaseError } from "@/lib/butterbase";
import { setSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json();
    await auth.signUp(email, password, displayName);
    // Butterbase allows login before email verification
    const session = await auth.signIn(email, password);
    await setSession(session);
    return NextResponse.json({ user: session.user });
  } catch (e) {
    const status = e instanceof ButterbaseError ? e.status : 500;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "signup failed" },
      { status }
    );
  }
}
