// ---- SOURCE layer ----
export interface RawSignal {
  source: string;
  source_type: string; // rss | search | ckan | fixture | ...
  source_url: string;
  title: string;
  text: string;
  published_at: string | null; // ISO
  fetched_at: string; // ISO
  entity_hint: string | null;
  location_hint: string | null;
  raw_metadata: Record<string, unknown>;
}

export interface SourceConnector {
  readonly id: string;
  readonly sourceType: string;
  readonly synthetic?: boolean;
  fetch(ctx: ConnectorContext): Promise<RawSignal[]>;
}
export interface ConnectorContext {
  http: HttpClient;
  log: Logger;
}
export interface HttpClient {
  getText(url: string, opts?: { ttlS?: number; headers?: Record<string, string>; respectRobots?: boolean }): Promise<string>;
  getJson<T = unknown>(url: string, opts?: { ttlS?: number }): Promise<T>;
}
export interface Logger {
  info(msg: string, extra?: unknown): void;
  warn(msg: string, extra?: unknown): void;
  error(msg: string, extra?: unknown): void;
}

// ---- SIGNAL / NEED layer ----
export type EventType =
  | 'NEW_LOCATION' | 'FUNDING_ROUND' | 'TENDER_PUBLISHED' | 'HIRING_SURGE' | 'NEW_COMPANY'
  | 'PRODUCT_LAUNCH' | 'EXPANSION' | 'MERGER_ACQUISITION' | 'CONSTRUCTION_PROJECT' | 'REBRAND' | 'EXPLICIT_REQUEST'
  | 'PERMIT_OR_OCCUPANCY' | 'CONTRACT_WIN' | 'EVENT_CONFERENCE' | 'OTHER_EVENT';

export interface PredictedNeed {
  need: string;          // Hebrew label
  category: string;      // taxonomy key
  confidence: number;    // 0..1 — MODEL/HEURISTIC confidence, NOT a statistic
  rationale: string;
}

export interface Extraction {
  is_opportunity: boolean;
  reject_reason?: string;
  entity?: string;
  event_type?: EventType;
  what_happened?: string;
  explicit_need?: { need: string; category: string; quote: string } | null;
  predicted_needs?: PredictedNeed[];
  category?: string;
  location?: string | null;
  intent_score?: number;      // 0..100
  confidence_score?: number;  // 0..100 (model confidence)
  estimated_value?: { amount_ils: number; basis: 'stated' } | null;
  urgency?: 'low' | 'medium' | 'high';
  evidence_quote?: string;
  expires_at?: string | null;
  // LLM v2 extras (optional; rules extractor leaves them empty)
  explicit_needs?: { need: string; category: string; quote: string }[];
  evidence_quotes?: string[];
  commercial_actions?: string[];
  deadline_at?: string | null; // only a deadline stated in the source (verified)
  llm_dropped?: string[];      // claims the validator removed (non-verbatim quotes, low confidence)
}

export interface NeedExtractor {
  readonly id: string;
  extract(raw: RawSignal): Promise<Extraction>;
}

export interface Evidence {
  raw_id: number;
  source_name: string;
  source_url: string;
  quote: string;
  published_at: string | null;
}

export interface Opportunity {
  id: number;
  entity: string;
  event_type: EventType;
  what_happened: string;
  explicit_need: { need: string; category: string; quote: string } | null;
  predicted_needs: PredictedNeed[];
  category: string;
  location: string | null;
  intent_score: number;
  confidence_score: number;
  estimated_value: { amount_ils: number; basis: 'stated' } | null;
  urgency: 'low' | 'medium' | 'high';
  evidence: Evidence[];
  source_url: string;
  source_name: string;
  published_at: string | null;
  expires_at: string | null;
  possible_solutions: string[];
  allowed_actions: string[];
  synthetic: boolean;
  extractor: string;
  high_quality: boolean;
  explicit_needs?: { need: string; category: string; quote: string }[];
  commercial_actions?: string[];
  deadline_at?: string | null;
}

// ---- Matching ----
export interface BusinessProfile {
  id?: number;
  name: string;
  url: string | null;
  description: string;
  services: string[];      // taxonomy keys
  regions: string[];       // city names, regions, or 'כל הארץ'
  customer_types: string[];
  deal_min: number | null;
  deal_max: number | null;
}
export interface Match {
  opportunity: Opportunity;
  score: number; // 0..100
  breakdown: Record<'service_fit' | 'location' | 'intent' | 'confidence' | 'freshness' | 'value', number>;
  why: string[];
  matched_categories: { category: string; kind: 'explicit' | 'predicted'; confidence: number }[];
}

// ---- Provider abstractions ----
export interface LLMProvider {
  readonly id: string;
  complete(req: { system: string; user: string; json?: boolean; maxTokens?: number }): Promise<string>;
}
export interface SearchHit { title: string; url: string; snippet: string; source: string | null; published_at: string | null }
export interface SearchProvider {
  readonly id: string;
  search(query: string, ctx: ConnectorContext): Promise<SearchHit[]>;
}
export interface OpportunityScorer {
  score(opps: Opportunity[], profile: BusinessProfile): Match[];
}
export interface ActionDraft {
  kind: 'outreach' | 'action_plan';
  subject?: string;
  body: string;
  steps: string[];
  status: 'draft_requires_approval';
}
export interface ActionProvider {
  readonly id: string;
  prepare(opp: Opportunity, profile: BusinessProfile, kind: ActionDraft['kind']): Promise<ActionDraft>;
  /** POC: never sends. Records user approval only. */
  execute(draft: ActionDraft, approved: boolean): Promise<{ executed: false; note: string }>;
}
