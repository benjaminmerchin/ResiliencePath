import { cookies } from "next/headers";
import { auth, BbSession, BbUser } from "./butterbase";

const AT_COOKIE = "bb_at";
const RT_COOKIE = "bb_rt";

export async function setSession(session: BbSession) {
  const jar = await cookies();
  jar.set(AT_COOKIE, session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: session.expires_in,
  });
  jar.set(RT_COOKIE, session.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(AT_COOKIE);
  jar.delete(RT_COOKIE);
}

/** Access token for the current request, refreshing if expired. */
export async function getToken(): Promise<string | null> {
  const jar = await cookies();
  const at = jar.get(AT_COOKIE)?.value;
  if (at) return at;
  const rt = jar.get(RT_COOKIE)?.value;
  if (!rt) return null;
  try {
    const session = await auth.refresh(rt);
    await setSession(session);
    return session.access_token;
  } catch {
    return null;
  }
}

export async function getUser(): Promise<{ user: BbUser; token: string } | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const user = await auth.me(token);
    return { user, token };
  } catch {
    return null;
  }
}
