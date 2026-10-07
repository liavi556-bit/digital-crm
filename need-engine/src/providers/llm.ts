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

/** Returns null when no LLM is configured -> engine falls back to rule-based extractors. */
export function createLLM(): LLMProvider | null {
  if (config.llmProvider === 'anthropic' && config.anthropicKey) return new AnthropicProvider();
  if (config.llmProvider === 'openai' && (config.openaiKey || config.openaiBase.includes('localhost'))) return new OpenAICompatProvider();
  return null;
}

export function parseJsonLoose<T>(s: string): T {
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('no JSON in LLM output');
  return JSON.parse(m[0]) as T;
}
