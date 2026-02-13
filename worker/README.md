# 🥝 Kiwi Docs MCP Server

An MCP (Model Context Protocol) server running on **Cloudflare Workers** that lets you "Ask the Kiwi" about your documentation. It fetches all Markdown files from your GitHub repo, sends them as context to **Gemini 2.5 Flash**, and returns an informed answer.

## Architecture

```
┌──────────────┐     MCP/JSON-RPC      ┌─────────────────────┐
│  MCP Client  │ ◄──────────────────►  │  Cloudflare Worker  │
│  (Claude,    │     POST /mcp         │  kiwi-docs-mcp      │
│   Cursor,    │     GET  /sse         │                     │
│   etc.)      │                       └────────┬────────────┘
└──────────────┘                                │
                                    ┌───────────┼───────────┐
                                    ▼                       ▼
                            ┌──────────────┐      ┌──────────────┐
                            │  GitHub API  │      │  Gemini 2.5  │
                            │  (fetch .md) │      │  Flash API   │
                            └──────────────┘      └──────────────┘
```

## Tools Provided

| Tool | Description |
|------|-------------|
| `ask_kiwi` | Ask a natural language question — the LLM reads all docs and answers |
| `list_docs` | List all available `.md` files in the repo |
| `search_docs` | Keyword search across all documentation files |

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)
- A [Google AI Studio API key](https://aistudio.google.com/apikey) for Gemini

### 1. Install dependencies

```bash
cd kiwi-mcp-worker
npm install
```

### 2. Configure your repo

Edit `wrangler.toml` and set your GitHub details:

```toml
[vars]
GITHUB_OWNER = "your-username"
GITHUB_REPO  = "your-docs-repo"
GITHUB_BRANCH = "main"
```

### 3. Add your Gemini API key

```bash
npx wrangler secret put GEMINI_API_KEY
# Paste your Google AI Studio key when prompted
```

For private repos, also add:

```bash
npx wrangler secret put GITHUB_TOKEN
# Paste a GitHub PAT with repo read access
```

### 4. (Optional) Enable KV caching

KV caching reduces GitHub API calls by caching docs for 5 minutes:

```bash
npx wrangler kv namespace create DOCS_CACHE
```

Copy the output `id` into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "DOCS_CACHE"
id = "paste-id-here"
```

### 5. Deploy

```bash
npm run deploy
```

Your MCP server is now live at `https://kiwi-docs-mcp.<your-subdomain>.workers.dev`.

### 6. Local development

```bash
npm run dev
```

Runs locally at `http://localhost:8787`.

## Connecting MCP Clients

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "kiwi-docs": {
      "url": "https://kiwi-docs-mcp.YOUR_SUBDOMAIN.workers.dev/sse"
    }
  }
}
```

### Claude Code

```bash
claude mcp add kiwi-docs https://kiwi-docs-mcp.YOUR_SUBDOMAIN.workers.dev/sse
```

### Cursor / other MCP clients

Point them at either:
- **SSE transport**: `GET https://your-worker.workers.dev/sse`
- **Streamable HTTP**: `POST https://your-worker.workers.dev/mcp`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check / server info |
| `/mcp` | POST | MCP JSON-RPC endpoint (Streamable HTTP transport) |
| `/sse` | GET | MCP SSE transport (sends endpoint URL, then keepalives) |

## Example MCP Request

```bash
curl -X POST https://kiwi-docs-mcp.YOUR_SUBDOMAIN.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "ask_kiwi",
      "arguments": {
        "question": "How do I add a custom building block?"
      }
    }
  }'
```

## Cost

- **Cloudflare Workers**: 100k requests/day free
- **Gemini 2.5 Flash**: Free tier available at Google AI Studio
- **GitHub API**: 60 req/hr unauthenticated, 5000/hr with token

## License

GNU GPL v3 — same as Kiwi Docs.
