import { spawn } from 'node:child_process';
import type { LLMProvider } from '../types.js';
import { config } from '../config.js';

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<any> {
  let err: unknown;
  for (let i = 1; i <= 3; i++) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(60000) });
      if (r.status === 429 || r.status >= 500) throw new Error(`HTTP ${r.status}`);
      if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`), { permanent: true });
      return await r.json();
    } catch (e) {
      err = e;
      if ((e as any).permanent) break;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
  throw err;
}

export class AnthropicProvider implements LLMProvider {
  id = 'anthropic';
  async complete({ system, user, maxTokens = 1500 }: Parameters<LLMProvider['complete']>[0]) {
    const j = await postJson(`${config.anthropicBase}/v1/messages`, { 'x-api-key': config.anthropicKey, 'anthropic-version': '2023-06-01' },
      { model: config.anthropicModel, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] });
    return (j.content ?? []).map((c: any) => c.text ?? '').join('');
  }
}

/** Works with OpenAI, Gemini (OpenAI-compat), OpenRouter, Ollama, vLLM… */
export class OpenAICompatProvider implements LLMProvider {
  id = 'openai';
  async complete({ system, user, json, maxTokens = 1500 }: Parameters<LLMProvider['complete']>[0]) {
    const j = await postJson(`${config.openaiBase}/chat/completions`, { authorization: `Bearer ${config.openaiKey}` }, {
      model: config.openaiModel, max_tokens: maxTokens,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    });
    return j.choices?.[0]?.message?.content ?? '';
  }
}


/**
 * Local Claude Code CLI in headless mode (`claude -p`), billed to the user's own Claude subscription.
 * Lean call: custom system prompt, no tools, no MCP, no settings -> ~200 input tokens of overhead.
 */
export class ClaudeCliProvider implements LLMProvider {
  get id() { return `claude-cli:${config.claudeCliModel}`; }
  complete({ system, user, schema }: Parameters<LLMProvider['complete']>[0]): Promise<string> {
    const args = ['-p', '--model', config.claudeCliModel, '--output-format', 'json', '--system-prompt', system,
      '--tools', '', '--strict-mcp-config', '--setting-sources', '', ...(schema ? ['--json-schema', JSON.stringify(schema)] : [])];
    return new Promise((resolve, reject) => {
      const p = spawn(config.claudeCliBin, args, { shell: false, windowsHide: true });
      let out = '', err = '';
      const timer = setTimeout(() => { p.kill(); reject(new Error('claude-cli timeout')); }, 240000);
      p.stdout.on('data', (d) => (out += d));
      p.stderr.on('data', (d) => (err += d));
      p.on('error', (e) => { clearTimeout(timer); reject(e); });
      p.on('close', (code) => {
        clearTimeout(timer);
        try {
          const j = JSON.parse(out);
          if (j.is_error) return reject(new Error(`claude-cli: ${String(j.result).slice(0, 200)}`));
          // structured output (when a schema was given) is valid, properly escaped JSON
          resolve(j.structured_output ? JSON.stringify(j.structured_output) : String(j.result ?? ''));
        } catch { reject(new Error(`claude-cli exit ${code}: ${(err || out).slice(0, 200)}`)); }
      });
      p.stdin.end(user);
    });
  }
}

/** Returns null when no LLM is configured -> engine falls back to rule-based extractors. */
export function createLLM(): LLMProvider | null {
  if (config.llmProvider === 'claude-cli') return new ClaudeCliProvider();
  if (config.llmProvider === 'anthropic' && config.anthropicKey) return new AnthropicProvider();
  if (config.llmProvider === 'openai' && (config.openaiKey || config.openaiBase.includes('localhost'))) return new OpenAICompatProvider();
  return null;
}

export function parseJsonLoose<T>(s: string): T {
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('no JSON in LLM output');
  try { return JSON.parse(m[0]) as T; }
  catch {
    // Hebrew abbreviations (בע"מ, ש"ח, תמ"א) often arrive with an unescaped " inside a JSON string.
    // A " between two Hebrew letters is never a JSON delimiter -> turn it into gershayim (״). Verbatim checks normalise both.
    return JSON.parse(m[0].replace(/(?<=[א-ת])"(?=[א-ת])/g, '״')) as T;
  }
}
