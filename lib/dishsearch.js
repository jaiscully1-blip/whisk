import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

// Live dish search with Claude + the web search tool. Server-only; the key never reaches the browser.
export const MODEL = () => process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
export const client = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 55_000, maxRetries: 1 });

/** Runs a message, continuing if the server-side web search pauses the turn. Returns all content blocks. */
export async function runWithSearch(params) {
  const anthropic = client();
  let messages = params.messages; const blocks = [];
  for (let round = 0; round < 3; round++) {
    const msg = await anthropic.messages.create({ ...params, messages });
    blocks.push(...msg.content);
    if (msg.stop_reason !== 'pause_turn') return blocks;
    messages = [...messages, { role: 'assistant', content: msg.content }];
  }
  return blocks;
}

const YT = /^https:\/\/(www\.|m\.)?(youtube\.com\/(watch\?v=[\w-]{6,}|shorts\/[\w-]{6,})|youtu\.be\/[\w-]{6,})/;
/** Real YouTube links: taken only from the search tool's own results, never from the model's text. */
export function youtubeResults(blocks) {
  const seen = new Set(); const out = [];
  for (const b of blocks) {
    if (b.type !== 'web_search_tool_result' || !Array.isArray(b.content)) continue;
    for (const r of b.content) {
      if (r.type !== 'web_search_result' || !YT.test(r.url || '')) continue;
      const u = new URL(r.url); const id = u.searchParams.get('v') || u.pathname.split('/').pop();
      if (seen.has(id)) continue; seen.add(id);
      out.push({ title: String(r.title || 'YouTube video').replace(/\s*-\s*YouTube\s*$/, '').slice(0, 140), url: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`, age: r.page_age || null });
    }
  }
  return out;
}
export const youtubeSearchUrl = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' recipe')}`;
