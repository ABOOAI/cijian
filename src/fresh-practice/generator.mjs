/** Bounded, offline authored practice. No remote requests, runtime AI, or fabricated capacity. */
import { freshCatalog } from './catalog.mjs';

export const GENERATOR_VERSION = 'authored-v1';
export const normalizeContent = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
// Full canonical text is intentionally retained, rather than a collision-prone short hash.
export function contentFingerprint(question) {
  const text = question.completedPassage || question.passage || question.prompt || '';
  return `content-v1:${normalizeContent(text)}`;
}
export function semanticVariationKey(question) { return question.semanticKey; }
function hash(text) {
  let h = 2166136261;
  for (const c of String(text)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const clone = value => JSON.parse(JSON.stringify(value));
function finish(question, seed) {
  const q = clone(question);
  q.options = q.options.map((value, index) => ({value,index, rank:hash(`${seed}|${q.semanticKey}|${value}`)})).sort((a,b)=>a.rank-b.rank || a.index-b.index).map(x=>x.value);
  q.contentFingerprint = contentFingerprint(q);
  q.semanticVariationKey = q.semanticKey;
  q.source = 'bounded-authored-fresh';
  q.generatorVersion = GENERATOR_VERSION;
  return q;
}
/** Returns a question or null. null means no unseen authored item remains for this filter. */
export function generateFresh({module, conceptId, excludedFingerprints = [], excludedSemanticKeys = [], seed = 0, forbiddenTexts = []} = {}) {
  const seen = new Set(excludedFingerprints);
  const semantics = new Set(excludedSemanticKeys);
  const forbidden = new Set(forbiddenTexts.map(normalizeContent));
  const candidates = freshCatalog.filter(q => (!module || q.module === module) && (!conceptId || q.conceptId === conceptId) && !seen.has(contentFingerprint(q)) && !semantics.has(q.semanticKey) && !forbidden.has(normalizeContent(q.completedPassage || q.passage || q.prompt)));
  candidates.sort((a,b)=>hash(`${seed}|${a.semanticKey}`)-hash(`${seed}|${b.semanticKey}`) || a.id.localeCompare(b.id));
  return candidates.length ? finish(candidates[0], seed) : null;
}
export function freshCapacity({module, conceptId, excludedFingerprints = [], excludedSemanticKeys = []} = {}) {
  const seen = new Set(excludedFingerprints), semantics = new Set(excludedSemanticKeys);
  const matching = freshCatalog.filter(q=>(!module || q.module===module) && (!conceptId || q.conceptId===conceptId));
  return { total:matching.length, remaining:matching.filter(q=>!seen.has(contentFingerprint(q)) && !semantics.has(q.semanticKey)).length, finite:true };
}
export function listFreshQuestions() { return freshCatalog.map(q=>finish(q,0)); }
