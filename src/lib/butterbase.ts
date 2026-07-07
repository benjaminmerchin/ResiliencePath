/**
 * Butterbase REST client (server-side).
 * Auth routes live at /auth/{app_id}/..., data + billing at /v1/{app_id}/...
 * Admin/data ops use the service key; user-scoped ops pass the end-user JWT (RLS enforced).
 */

const BASE = "https://api.butterbase.ai";
const APP_ID = process.env.NEXT_PUBLIC_BUTTERBASE_APP_ID ?? "app_zcm5kx237fhz";
const SERVICE_KEY = process.env.BUTTERBASE_SERVICE_KEY;

export interface BbUser {
  id: string;
  email: string;
  email_verified: boolean;
  display_name: string | null;
  avatar_url: string | null;
}

export interface BbSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: BbUser;
}

async function req<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, ...rest } = init;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  // token === null → public endpoint, no Authorization header
  if (token !== null) headers.Authorization = `Bearer ${token ?? SERVICE_KEY}`;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: { ...headers, ...rest.headers },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      body?.error?.message ?? body?.message ?? `Butterbase ${res.status}`;
    throw new ButterbaseError(msg, res.status, body);
  }
  return body as T;
}

export class ButterbaseError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown
  ) {
    super(message);
  }
}

// ---------- Auth ----------
export const auth = {
  signUp: (email: string, password: string, display_name?: string) =>
    req<BbSession>(`/auth/${APP_ID}/signup`, {
      method: "POST",
      body: JSON.stringify({ email, password, display_name }),
      token: null,
    }),
  signIn: (email: string, password: string) =>
    req<BbSession>(`/auth/${APP_ID}/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
      token: null,
    }),
  me: (token: string) => req<BbUser>(`/auth/${APP_ID}/me`, { token }),
  refresh: (refresh_token: string) =>
    req<BbSession>(`/auth/${APP_ID}/refresh`, {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
      token: null,
    }),
};

// ---------- Data (PostgREST-style) ----------
export const db = {
  select: <T>(table: string, query = "", token?: string) =>
    req<T[]>(`/v1/${APP_ID}/${table}${query ? `?${query}` : ""}`, { token }),
  insert: <T>(table: string, row: Record<string, unknown>, token?: string) =>
    req<T>(`/v1/${APP_ID}/${table}`, {
      method: "POST",
      body: JSON.stringify(row),
      token,
    }),
  update: <T>(
    table: string,
    id: string,
    patch: Record<string, unknown>,
    token?: string
  ) =>
    req<T>(`/v1/${APP_ID}/${table}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
      token,
    }),
};

// ---------- Billing (Stripe Connect via Butterbase) ----------
export const billing = {
  connectOnboard: () =>
    req<{ url: string }>(`/v1/${APP_ID}/billing/connect/onboard`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  connectStatus: () => req(`/v1/${APP_ID}/billing/connect/status`),
  createPlan: (plan: {
    name: string;
    priceCents: number;
    interval: string;
    features?: string[];
  }) =>
    req(`/v1/${APP_ID}/billing/plans`, {
      method: "POST",
      body: JSON.stringify(plan),
    }),
  listPlans: () => req(`/v1/${APP_ID}/billing/plans`),
  subscribe: (
    token: string,
    planId: string,
    successUrl: string,
    cancelUrl: string
  ) =>
    req<{ url: string }>(`/v1/${APP_ID}/billing/subscribe`, {
      method: "POST",
      body: JSON.stringify({ planId, successUrl, cancelUrl }),
      token,
    }),
  subscription: (token: string) =>
    req(`/v1/${APP_ID}/billing/subscription`, { token }),
};

// ---------- AI gateway (OpenAI-compatible) ----------
export async function chatCompletion(
  messages: { role: string; content: string }[],
  model = "anthropic/claude-sonnet-4.6",
  max_tokens = 2000
): Promise<string> {
  const res = await req<{
    choices: { message: { content: string } }[];
  }>(`/v1/chat/completions`, {
    method: "POST",
    body: JSON.stringify({ model, messages, max_tokens }),
  });
  return res.choices[0]?.message?.content ?? "";
}
