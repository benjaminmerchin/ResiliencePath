/**
 * Cognee AI memory client (hosted tenant).
 * The agent remembers household context across sessions and recalls it
 * to personalize new assessments.
 *
 * Verified API: POST /api/v1/add (multipart, data as file + datasetName),
 * POST /api/v1/cognify {datasets:[...]}, POST /api/v1/search
 * {query, searchType, datasets} → [{search_result: [...]}].
 */

const BASE = process.env.COGNEE_API_URL;
const AUTH_HEADERS: Record<string, string> = {
  "X-Api-Key": process.env.COGNEE_API_KEY ?? "",
  "X-Tenant-Id": process.env.COGNEE_TENANT_ID ?? "",
};

const DATASET = "resiliencepath-memory";

async function cogneeFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...AUTH_HEADERS, ...init.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Cognee ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return res.json();
}

/** Store a fact/observation about a household in agent memory. */
export async function remember(text: string): Promise<void> {
  const form = new FormData();
  form.append(
    "data",
    new Blob([text], { type: "text/plain" }),
    `memory-${Date.now()}.txt`
  );
  form.append("datasetName", DATASET);
  await cogneeFetch(`/api/v1/add`, { method: "POST", body: form });
  // build/refresh the knowledge graph from newly added data
  await cogneeFetch(`/api/v1/cognify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ datasets: [DATASET] }),
  });
}

/** Recall relevant memories for a query. Returns text snippets. */
export async function recall(query: string): Promise<string[]> {
  const res = await cogneeFetch(`/api/v1/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      searchType: "GRAPH_COMPLETION",
      datasets: [DATASET],
    }),
  });
  if (Array.isArray(res)) {
    return res.flatMap((r) =>
      Array.isArray(r?.search_result)
        ? r.search_result.map((s: unknown) =>
            typeof s === "string" ? s : JSON.stringify(s)
          )
        : []
    );
  }
  return [];
}

/** Fire-and-forget variants: memory must never break an assessment. */
export async function tryRemember(text: string): Promise<boolean> {
  try {
    await remember(text);
    return true;
  } catch (e) {
    console.warn("cognee remember failed:", e);
    return false;
  }
}

export async function tryRecall(query: string): Promise<string[]> {
  try {
    return await recall(query);
  } catch (e) {
    console.warn("cognee recall failed:", e);
    return [];
  }
}
