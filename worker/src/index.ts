/**
 * Kiwi Docs MCP Server + Chat API — Cloudflare Worker
 */

import * as jose from 'jose';

export interface Env {
  GEMINI_API_KEY: string;
  FIREBASE_PROJECT_ID: string;
  GITHUB_TOKEN?: string;
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  ALLOWED_ORIGINS?: string;
  DOCS_CACHE: KVNamespace;
}

// ── Types ────────────────────────────────────────────────────────────

interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface DocFile {
  name: string;
  path: string;
  content: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  timestamp?: number;
}

interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  updatedAt: number;
}

// ── Auth helper ──────────────────────────────────────────────────────

const JWKS = jose.createRemoteJWKSet(new URL('https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com'));

async function verifyFirebaseToken(token: string, projectId: string) {
  try {
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    return payload;
  } catch (err) {
    console.error('Auth verification failed:', err);
    return null;
  }
}

// ── CORS helper ──────────────────────────────────────────────────────

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("Origin") || "*";
  const allowed = env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
    : null;

  const effectiveOrigin =
    !allowed || allowed.includes("*") || allowed.includes(origin)
      ? origin
      : allowed[0];

  return {
    "Access-Control-Allow-Origin": effectiveOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, authorization, X-Firebase-ID-Token",
    "Access-Control-Max-Age": "86400",
  };
}

// ── GitHub helpers ───────────────────────────────────────────────────

async function fetchRepoMarkdownFiles(env: Env): Promise<DocFile[]> {
  const owner = env.GITHUB_OWNER || "kiwidocs";
  const repo = env.GITHUB_REPO || "kiwidocs";
  const branch = env.GITHUB_BRANCH || "main";

  if (env.DOCS_CACHE) {
    try {
      const cached = await env.DOCS_CACHE.get("docs_bundle", "json");
      if (cached) return cached as DocFile[];
    } catch { /* cache miss */ }
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "kiwi-mcp-worker",
  };
  if (env.GITHUB_TOKEN) {
    headers.Authorization = `token ${env.GITHUB_TOKEN}`;
  }

  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers });
  if (!treeRes.ok) throw new Error(`GitHub tree fetch failed: ${treeRes.status}`);

  const treeData = (await treeRes.json()) as { tree: { path: string; type: string }[] };
  const mdPaths = treeData.tree
    .filter((f) => f.type === "blob" && f.path.endsWith(".md"))
    .map((f) => f.path);

  const files: DocFile[] = await Promise.all(
    mdPaths.map(async (path) => {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
      const res = await fetch(rawUrl, { headers: { "User-Agent": "kiwi-mcp-worker" } });
      const content = res.ok ? await res.text() : "";
      return { name: path.replace(/\.md$/, ""), path, content };
    })
  );

  const extraPaths = treeData.tree
    .filter((f) => f.type === "blob" && (f.path.endsWith(".TBD") || f.path.endsWith(".kiwi")))
    .map((f) => f.path);

  const extraFiles: DocFile[] = await Promise.all(
    extraPaths.map(async (path) => {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
      const res = await fetch(rawUrl, { headers: { "User-Agent": "kiwi-mcp-worker" } });
      const content = res.ok ? await res.text() : "";
      return { name: path, path, content };
    })
  );

  const allFiles = [...files, ...extraFiles];

  if (env.DOCS_CACHE) {
    try {
      await env.DOCS_CACHE.put("docs_bundle", JSON.stringify(allFiles), { expirationTtl: 300 });
    } catch { /* cache write failed */ }
  }

  return allFiles;
}

// ── Gemini helper ───────────────────────────────────────────────────

async function askGemini(
  apiKey: string,
  systemPrompt: string,
  messages: { role: string; text: string }[]
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.text }],
  }));

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    candidates: { content: { parts: { text: string }[] } }[];
  };

  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
}

function buildSystemPrompt(docs: DocFile[]): string {
  const context = docs
    .map((d) => `--- FILE: ${d.path} ---\n${d.content}`)
    .join("\n\n");

  return `You are Kiwi 🥝, a friendly documentation assistant for the Kiwi Docs project.
RULES:
- Answer questions ONLY based on the documentation provided below.
- If the answer isn't in the docs, say so honestly.
- Be concise. Use markdown.
- Mention files by name (e.g. \`building.TBD\`).

=== DOCUMENTATION ===
${context}
=== END DOCUMENTATION ===`;
}

// ── Persistence Helpers ──────────────────────────────────────────────

async function saveChatSession(env: Env, uid: string, sessionId: string, messages: ChatMessage[]) {
  const key = `chat:${uid}:${sessionId}`;
  const data: ChatSession = {
    sessionId,
    messages,
    updatedAt: Date.now()
  };
  await env.DOCS_CACHE.put(key, JSON.stringify(data));

  // Update session list
  const listKey = `sessions:${uid}`;
  const listRaw = await env.DOCS_CACHE.get(listKey, "json") as any[] || [];
  const existing = listRaw.findIndex(s => s.sessionId === sessionId);
  const sessionInfo = {
    sessionId,
    lastMessage: messages[messages.length - 1].text.substring(0, 50) + "...",
    updatedAt: data.updatedAt
  };

  if (existing > -1) {
    listRaw[existing] = sessionInfo;
  } else {
    listRaw.unshift(sessionInfo);
  }
  // Keep only last 50 sessions
  await env.DOCS_CACHE.put(listKey, JSON.stringify(listRaw.slice(0, 50)));
}

// ═══════════════════════════════════════════════════════════════════════
//  REST API 
// ═══════════════════════════════════════════════════════════════════════

async function handleAPIAsk(request: Request, env: Env): Promise<Response> {
  const cors = corsHeaders(request, env);
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  const payload = token ? await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID) : null;
  const uid = payload?.sub as string;

  try {
    const body = (await request.json()) as {
      question: string;
      sessionId?: string;
      history?: ChatMessage[];
    };

    if (!body.question?.trim()) {
      return new Response(JSON.stringify({ error: "Missing question" }), { status: 400, headers: cors });
    }

    const docs = await fetchRepoMarkdownFiles(env);
    const systemPrompt = buildSystemPrompt(docs);

    const messages: { role: string; text: string }[] = [];
    if (body.history && Array.isArray(body.history)) {
      messages.push(...body.history.map(m => ({ role: m.role, text: m.text })));
    }
    messages.push({ role: "user", text: body.question });

    const answer = await askGemini(env.GEMINI_API_KEY, systemPrompt, messages);

    // Save to persistence if uid exists
    if (uid && body.sessionId) {
      const fullHistory = [...(body.history || []), { role: "user", text: body.question } as ChatMessage, { role: "assistant", text: answer } as ChatMessage];
      await saveChatSession(env, uid, body.sessionId, fullHistory);
    }

    return new Response(JSON.stringify({ answer }), { headers: { "Content-Type": "application/json", ...cors } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
  }
}

async function handleAPIHistory(request: Request, env: Env): Promise<Response> {
  const cors = corsHeaders(request, env);
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!token) return new Response("Unauthorized", { status: 401, headers: cors });

  const payload = await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID);
  if (!payload) return new Response("Invalid token", { status: 401, headers: cors });

  const uid = payload.sub as string;
  const url = new URL(request.url);
  const sessionId = url.pathname.split("/").pop();

  if (sessionId && sessionId !== "history") {
    const session = await env.DOCS_CACHE.get(`chat:${uid}:${sessionId}`, "json");
    return new Response(JSON.stringify(session || { error: "Not found" }), { headers: { "Content-Type": "application/json", ...cors } });
  }

  const list = await env.DOCS_CACHE.get(`sessions:${uid}`, "json") || [];
  return new Response(JSON.stringify({ sessions: list }), { headers: { "Content-Type": "application/json", ...cors } });
}

// ═══════════════════════════════════════════════════════════════════════
//  Worker entry 
// ═══════════════════════════════════════════════════════════════════════

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    if (url.pathname === "/api/ask" && request.method === "POST") {
      return handleAPIAsk(request, env);
    }

    if (url.pathname.startsWith("/api/history")) {
      return handleAPIHistory(request, env);
    }

    if (url.pathname === "/api/search") {
      // (Simplified search from original)
      return new Response("Search endpoint", { headers: cors });
    }

    if (url.pathname === "/api/docs") {
      const docs = await fetchRepoMarkdownFiles(env);
      return new Response(JSON.stringify({ docs: docs.map(d => ({ name: d.name, path: d.path })) }), { headers: cors });
    }

    // Health check
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", server: "kiwi-docs-mcp-v2" }), { headers: cors });
    }

    return new Response("Not found", { status: 404, headers: cors });
  },
};
